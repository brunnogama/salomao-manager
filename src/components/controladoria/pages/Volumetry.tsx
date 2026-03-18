import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  BarChart3,
  Scale,
  FileText,
  Download,
  PieChart,
  Activity,
  Layers,
  ShieldCheck
} from 'lucide-react';
import XLSX from 'xlsx-js-style';

import { VolumetryProcesses } from './VolumetryProcesses';
import { FilterSelect } from '../ui/FilterSelect';

export function Volumetry() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'processos'>('dashboard');
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Globais para o Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState(''); // Responsável Principal

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
          .select('cliente_principal,numero_cnj,pasta,status,responsavel_principal,data_cadastro,data_encerramento,uf,tipo,instancia')
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

  // Normalizar nome para Title Case e corrigir Luiz Henrique Pavan
  const toTitleCase = (str: string) => {
    let n = str.trim().toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
    if (n === 'Luiz Henrique Pavan') n = 'Luiz Henrique Miguel Pavan';
    return n;
  };

  // --------------- Lógica de Filtragem no Dashboard ---------------
  const baseProcesses = processes.filter((proc: any) => {
    const matchesSearch =
      (proc.cliente_principal && proc.cliente_principal.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proc.numero_cnj && proc.numero_cnj.includes(searchTerm)) ||
      (proc.pasta && proc.pasta.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter ? proc.status?.toLowerCase() === statusFilter.toLowerCase() : true;

    return matchesSearch && matchesStatus;
  });

  const filteredProcesses = baseProcesses.filter((proc: any) => {
    const matchesPartner = partnerFilter ? toTitleCase(proc.responsavel_principal || '') === partnerFilter : true;
    return matchesPartner;
  });

  // Métricas
  const totalProcesses = filteredProcesses.length;
  
  const ativosCount = filteredProcesses.filter(p => p.status?.toLowerCase() === 'ativo').length;
  const arquivadosCount = filteredProcesses.filter(p => p.status?.toLowerCase() === 'arquivado').length;

  const uniqueClients = new Set(filteredProcesses.map(p => p.cliente_principal).filter(Boolean)).size;

  // Calculo de processos duplicados pelo numero CNJ
  const cnjCounts = filteredProcesses.reduce((acc: Record<string, number>, p: any) => {
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

  // --------------- Agrupamento por Responsável ---------------
  const baseForPercentage = baseProcesses.length;

  const volumetryByPartner = allPartners.map(partnerName => {
    const partnerProcs = filteredProcesses.filter(p => toTitleCase(p.responsavel_principal || '') === partnerName);
    
    return {
      name: partnerName || 'Sem Responsável',
      count: partnerProcs.length,
      percentage: baseForPercentage > 0 ? ((partnerProcs.length / baseForPercentage) * 100).toFixed(1) : "0",
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

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Volumetria");
    XLSX.writeFile(wb, "Volumetria_LegalOne.xlsx");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">

      {/* 1. Header - Salomão Design System (Padrão Colaboradores) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Left: Título e Ícone */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Volumetria</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">Visão Analítica LegalOne</p>
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
            <button onClick={handleExportDashboard} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-[0.1em] shadow-sm active:scale-95">
              <Download className="h-4 w-4" /> Exportar Dashboard
            </button>
          )}
        </div>
      </div>

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
                <FilterSelect
                  value={partnerFilter}
                  onChange={(v) => setPartnerFilter(v || '')}
                  placeholder="Todos"
                  options={allPartners.map(p => ({ value: p as string, label: p as string }))}
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                <FilterSelect
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v || '')}
                  placeholder="Todos"
                  options={allStatuses.map(s => ({ value: s as string, label: s as string }))}
                />
              </div>
          </div>

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
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processos Arquivados</p>
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

          {/* Distribuição de Tipos */}
          {!loading && processes.length > 0 && (
            <ProcessTypeDistributionSection processes={filteredProcesses} />
          )}

          {/* Lista de Volumetria por Responsável */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1e3a8a]" /> Distribuição por Líder Responsável
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
                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-black text-xs border border-blue-100">
                                {partner.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-black text-[#0a192f] uppercase tracking-tight">{partner.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-50 text-[#1e3a8a] px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-100">
                              {partner.count.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                              {partner.ativos.toLocaleString('pt-BR')}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                              {partner.arquivados.toLocaleString('pt-BR')}
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
      relevantProcesses = processes.filter(p => p.status?.toLowerCase() === 'arquivado');
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
                  <p className="text-[11px] font-black text-[#0a192f] uppercase tracking-tight truncate" title={s.label}>{s.label}</p>
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

function ProcessTypeDistributionSection({ processes }: { processes: any[] }) {
  const total = processes.length;
  if (total === 0) return null;

  const getCount = (type: string) => processes.filter(p => String(p.tipo || '').toLowerCase().includes(type.toLowerCase())).length;

  const adminCount = getCount('administrativo');
  const judCount = getCount('judicial');
  const arbCount = getCount('arbitr');

  const stats = [
    { label: 'Administrativo', count: adminCount, color: 'bg-indigo-500', text: 'text-indigo-700' },
    { label: 'Judicial', count: judCount, color: 'bg-cyan-500', text: 'text-cyan-700' },
    { label: 'Arbitral', count: arbCount, color: 'bg-fuchsia-500', text: 'text-fuchsia-700' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#1e3a8a]" /> Processos por Tipo
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(s => {
            const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : "0";
            return (
              <div key={s.label} className="flex flex-col gap-2 p-4 rounded-xl border border-gray-50 bg-gray-50/30">
                <div className="flex justify-between items-end">
                   <p className="text-[11px] font-black text-[#0a192f] uppercase tracking-tight">{s.label}</p>
                   <div className="flex items-baseline gap-1">
                     <span className={`text-lg font-black ${s.text}`}>{s.count.toLocaleString('pt-BR')}</span>
                     <span className="text-[10px] font-bold text-gray-400">({pct}%)</span>
                   </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50 shadow-inner">
                  <div
                    className={`${s.color} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}