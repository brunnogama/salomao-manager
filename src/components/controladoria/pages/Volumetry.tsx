import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  BarChart3,
  Scale,
  FileText,
  Download,
  PieChart,
  Activity,
  Layers,
  TrendingUp,
  Share2,
  Check
} from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';

import { VolumetryProcesses } from './VolumetryProcesses';

export function Volumetry({ isPublicView = false }: { isPublicView?: boolean }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'processos'>('dashboard');
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filtros Globais para o Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState(''); // Responsável Principal

  const [selectedChartYear, setSelectedChartYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchProcesses();
  }, [activeTab]); // Recarrega quando muda de aba, caso a pessoa importe novos

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
          .select('cliente_principal,numero_cnj,pasta,status,responsavel_principal,data_cadastro,data_encerramento')
          .range(from, from + step - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
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
  const processesMatchingSearchAndStatus = processes.filter((proc: any) => {
    const matchesSearch =
      (proc.cliente_principal && proc.cliente_principal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proc.numero_cnj && proc.numero_cnj.includes(searchTerm)) ||
      (proc.pasta && proc.pasta.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter ? proc.status?.toLowerCase() === statusFilter.toLowerCase() : true;
    return matchesSearch && matchesStatus;
  });

  const filteredProcesses = processesMatchingSearchAndStatus.filter((proc: any) => {
    return partnerFilter ? proc.responsavel_principal === partnerFilter : true;
  });

  // Métricas
  const totalProcesses = filteredProcesses.length;
  
  const ativosCount = filteredProcesses.filter(p => p.status?.toLowerCase() === 'ativo').length;
  const arquivadosCount = filteredProcesses.filter(p => p.status?.toLowerCase() === 'arquivado').length;

  const uniqueClients = new Set(filteredProcesses.map(p => p.cliente_principal).filter(Boolean)).size;

  const { allYears, chartDataYearly } = useMemo(() => {
    const yearsSet = new Set<number>();
    filteredProcesses.forEach(p => {
      if (p.data_cadastro) {
        yearsSet.add(parseInt(p.data_cadastro.substring(0, 4), 10));
      }
      if (p.data_encerramento) {
        yearsSet.add(parseInt(p.data_encerramento.substring(0, 4), 10));
      }
    });

    const years = Array.from(yearsSet).filter(y => !isNaN(y)).sort((a, b) => a - b);
    const minYear = years[0] || new Date().getFullYear();
    const maxYear = years[years.length - 1] || new Date().getFullYear();
    
    let runningSaldo = 0;
    const dataByYear: Record<number, any[]> = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let y = minYear; y <= maxYear; y++) {
      dataByYear[y] = [];
      for (let m = 0; m < 12; m++) {
        const entrantesCount = filteredProcesses.filter(p => {
          if (!p.data_cadastro) return false;
          const py = parseInt(p.data_cadastro.substring(0, 4), 10);
          const pm = parseInt(p.data_cadastro.substring(5, 7), 10) - 1;
          return py === y && pm === m;
        }).length;
        
        const encerradosCount = filteredProcesses.filter(p => {
          if (!p.data_encerramento) return false;
          const py = parseInt(p.data_encerramento.substring(0, 4), 10);
          const pm = parseInt(p.data_encerramento.substring(5, 7), 10) - 1;
          return py === y && pm === m;
        }).length;

        runningSaldo = runningSaldo + entrantesCount - encerradosCount;
        
        dataByYear[y].push({
          name: monthNames[m],
          Entrantes: entrantesCount,
          Encerrados: encerradosCount,
          Saldo: runningSaldo,
        });
      }
    }

    if (years.length === 0) {
        years.push(new Date().getFullYear());
        dataByYear[new Date().getFullYear()] = monthNames.map(name => ({
            name, Entrantes: 0, Encerrados: 0, Saldo: 0
        }));
    }

    return { allYears: years, chartDataYearly: dataByYear };
  }, [filteredProcesses]);

  useEffect(() => {
    if (allYears.length > 0 && !allYears.includes(selectedChartYear)) {
      setSelectedChartYear(allYears[allYears.length - 1]);
    }
  }, [allYears, selectedChartYear]);

  const currentChartData = chartDataYearly[selectedChartYear] || [];

  // Extrair lista de responsáveis únicos para o filtro
  const allPartners = Array.from(new Set(processes.map(p => p.responsavel_principal).filter(Boolean))).sort();
  // Extrair status únicos (Ativo, Arquivado, etc)
  const allStatuses = Array.from(new Set(processes.map(p => p.status).filter(Boolean))).sort();

  // --------------- Agrupamento por Responsável ---------------
  const totalForPartners = processesMatchingSearchAndStatus.length;
  const volumetryByPartner = allPartners.map(partnerName => {
    const partnerProcs = processesMatchingSearchAndStatus.filter(p => p.responsavel_principal === partnerName);
    
    return {
      name: partnerName || 'Sem Responsável',
      count: partnerProcs.length,
      percentage: totalForPartners > 0 ? ((partnerProcs.length / totalForPartners) * 100).toFixed(1) : "0",
      ativos: partnerProcs.filter(p => p.status?.toLowerCase() === 'ativo').length,
      arquivados: partnerProcs.filter(p => p.status?.toLowerCase() === 'arquivado').length,
    };
  }).filter(p => p.count > 0).sort((a, b) => b.count - a.count); // Remove quem zerou no filtro e ordena desc


  const handleExportDashboard = () => {
    const exportData = volumetryByPartner.map((m: any) => ({
      'Líder Responsável': m.name,
      'Total de Processos': m.count,
      'Ativos': m.ativos,
      'Arquivados': m.arquivados,
      '% Representatividade': `${m.percentage}%`
    }));

    const ws1 = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Volumetria por Líder");

    // Gerar aba extra de Movimento Processual baseada no ano selecionado
    const chartExportData = currentChartData.map((d: any) => ({
      'Mês': d.name,
      'Entrantes (Novos)': d.Entrantes,
      'Encerrados (Baixas)': d.Encerrados,
      'Saldo Ativo Total': d.Saldo,
      'Ano Base': selectedChartYear
    }));

    const ws2 = XLSX.utils.json_to_sheet(chartExportData);
    XLSX.utils.book_append_sheet(wb, ws2, `Movimentação ${selectedChartYear}`);

    XLSX.writeFile(wb, "Volumetria_LegalOne_Dashboard.xlsx");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">

      {/* 1. Header - Salomão Design System */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Volumetria</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Visão Analítica LegalOne</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {!isPublicView && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/public/volumetria`;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 3000);
              }}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-50 border border-blue-200 text-[#1e3a8a] rounded-xl hover:bg-blue-100 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              {copiedLink ? 'Link Copiado!' : 'Compartilhar'}
            </button>
          )}

          {activeTab === 'dashboard' && volumetryByPartner.length > 0 && (
            <button onClick={handleExportDashboard} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-sm active:scale-95">
              <Download className="h-4 w-4" /> Exportar Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Navegação de Abas - Se não for visão pública */}
      {!isPublicView && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#1e3a8a] text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Dashboard Processual
            </button>
            <button
              onClick={() => setActiveTab('processos')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'processos'
                  ? 'bg-[#1e3a8a] text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Base de Processos (Planilha)
            </button>
          </div>
      )}

      {activeTab === 'dashboard' ? (
        <div className="flex flex-col space-y-6">
          
          {/* Dashboard Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
             <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Busca (Cliente, CNJ ou Pasta)</label>
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-600 font-medium placeholder:text-gray-400"
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Líder Responsável</label>
                <select
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-600 font-medium appearance-none"
                >
                  <option value="">Todos</option>
                  {allPartners.map((p, idx) => (
                    <option key={idx} value={p as string}>{p as string}</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-600 font-medium appearance-none"
                >
                  <option value="">Todos</option>
                  {allStatuses.map((s, idx) => (
                    <option key={idx} value={s as string}>{s as string}</option>
                  ))}
                </select>
              </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-blue-600"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total de Processos</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{totalProcesses}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-emerald-600"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos Ativos</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{ativosCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-amber-500"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos Arquivados</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{arquivadosCount}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 h-full w-1 bg-purple-600"></div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clientes Únicos</p>
                <p className="text-2xl font-black text-purple-900 mt-1">{uniqueClients}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Gráfico Mensal de Entrantes e Encerrados */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1e3a8a]" /> Movimentação Processual
              </h2>
              
              {/* Abas por Ano */}
              <div className="flex bg-white border border-gray-200 p-1 rounded-xl overflow-x-auto max-w-full custom-scrollbar shadow-sm">
                {allYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedChartYear(year)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      selectedChartYear === year
                        ? 'bg-[#1e3a8a] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={currentChartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 800 }}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 800 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 800 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 900, color: '#0a192f', marginBottom: '8px', textTransform: 'uppercase' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                  />
                  <Bar yAxisId="left" dataKey="Entrantes" name="Entrantes" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="Entrantes" position="top" style={{ fill: '#10B981', fontSize: '9px', fontWeight: 900, textAnchor: 'middle' }} />
                  </Bar>
                  <Bar yAxisId="left" dataKey="Encerrados" name="Encerrados" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="Encerrados" position="top" style={{ fill: '#EF4444', fontSize: '9px', fontWeight: 900, textAnchor: 'middle' }} />
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="Saldo" name="Saldo Ativo" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }}>
                    <LabelList dataKey="Saldo" position="top" offset={10} style={{ fill: '#1e3a8a', fontSize: '9px', fontWeight: 900, textAnchor: 'middle' }} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lista de Volumetria por Responsável */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1e3a8a]" /> Distribuição por Líder Responsável
                <span className="text-[10px] text-gray-400 font-semibold ml-2 normal-case tracking-normal hidden sm:inline">(Clique em um líder para filtrar)</span>
              </h2>
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
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[800px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Líder Responsável</th>
                        <th className="p-4 text-center text-[10px] font-black text-white uppercase tracking-widest">Total de Processos</th>
                        <th className="p-4 text-center text-[10px] font-black text-white uppercase tracking-widest">Ativos</th>
                        <th className="p-4 text-center text-[10px] font-black text-white uppercase tracking-widest">Arquivados</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Representatividade na Base</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {volumetryByPartner.map((partner, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setPartnerFilter(partnerFilter === partner.name ? '' : partner.name)}
                          className={`transition-all cursor-pointer ${
                            partnerFilter === partner.name 
                              ? 'bg-blue-50/80 shadow-[inset_4px_0_0_0_#1e3a8a]' 
                              : 'hover:bg-blue-50/30 group'
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${
                                partnerFilter === partner.name ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]' : 'bg-blue-50 text-[#1e3a8a] border-blue-100'
                              }`}>
                                {partner.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-xs font-black uppercase tracking-tight ${partnerFilter === partner.name ? 'text-[#1e3a8a]' : 'text-[#0a192f]'}`}>
                                  {partner.name}
                                </span>
                                {partnerFilter === partner.name && (
                                  <span className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-widest mt-0.5">Filtro Ativado (Clique para Remover)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-50 text-[#1e3a8a] px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-100">
                              {partner.count}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                              {partner.ativos}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                              {partner.arquivados}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-4">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden max-w-[200px] border border-gray-200/50 shadow-inner">
                                <div
                                  className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${partner.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest w-12">{partner.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

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