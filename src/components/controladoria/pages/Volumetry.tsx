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
  FileSpreadsheet
} from 'lucide-react';
import XLSX from 'xlsx-js-style';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

import { VolumetryProcesses } from './VolumetryProcesses';
import { MultiFilterSelect } from '../ui/MultiFilterSelect';

const toTitleCase = (str: string) => {
  let n = str.trim().toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
  if (n === 'Luiz Henrique Pavan') n = 'Luiz Henrique Miguel Pavan';
  return n;
};

export function Volumetry() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'processos'>('dashboard');
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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
  const arquivadosCount = topCardsProcesses.filter(p => p.status?.toLowerCase() === 'arquivado').length;

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
      arquivados: rawPartnerProcs.filter(p => p.status?.toLowerCase() === 'arquivado').length,
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
    const wb = XLSX.utils.book_new();

    // 1. Aba Volumetria (Dashboard)
    const exportData = volumetryByPartner.map((m: any) => ({
      'Líder Responsável': m.name,
      'Sócio (Grupo)': m.socio,
      'Ativos': m.ativos,
      'Administrativo': m.administrativo,
      'Judicial': m.judicial,
      'Arbitral': m.arbitral,
      'Arquivados': m.arquivados,
      '% Representatividade': `${m.percentage}%`
    }));
    const wsVolumetry = XLSX.utils.json_to_sheet(exportData);
    
    // Formatando larguras de colunas elegantemente
    wsVolumetry['!cols'] = [
      { wch: 40 }, // Líder
      { wch: 40 }, // Sócio
      { wch: 15 }, // Ativos
      { wch: 20 }, // Admin
      { wch: 15 }, // Judic
      { wch: 15 }, // Arb
      { wch: 15 }, // Arq
      { wch: 25 }, // Representatividade
    ];
    XLSX.utils.book_append_sheet(wb, wsVolumetry, "Volumetria");

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
    }));
    
    if (exportProcesses.length > 0) {
      const wsProcesses = XLSX.utils.json_to_sheet(exportProcesses);
      wsProcesses['!cols'] = [
        { wch: 20 }, { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 35 },
        { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsProcesses, "Processos Relacionados");
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
      
      const wsDuplicates = XLSX.utils.json_to_sheet(exportDuplicates);
      wsDuplicates['!cols'] = [
        { wch: 35 }, { wch: 20 }, { wch: 35 }, { wch: 35 },
        { wch: 35 }, { wch: 15 }, { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(wb, wsDuplicates, "Processos Duplicados");
    }

    XLSX.writeFile(wb, "Volumetria_LegalOne.xlsx");
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

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#f8fafc', // Tailwind gray-50
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
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportDashboard} 
                className="w-10 h-10 flex items-center justify-center bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
                title="Exportar em XLSX"
              >
                <FileSpreadsheet className="h-5 w-5" />
              </button>
              
              <button 
                onClick={handleExportPDF} 
                disabled={isExportingPDF}
                className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-full hover:bg-red-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Exportar Dashboard em PDF"
              >
                {isExportingPDF ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              </button>
            </div>
          )}
          <div id="volumetry-actions" className="flex items-center gap-2 empty:hidden"></div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="flex flex-col space-y-6" id="volumetry-dashboard-content">
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
                <MultiFilterSelect
                  value={partnerFilter}
                  onChange={setPartnerFilter}
                  placeholder="Todos"
                  options={allPartners.map(p => ({ value: p as string, label: p as string }))}
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sócio</label>
                <MultiFilterSelect
                  value={socioFilter}
                  onChange={setSocioFilter}
                  placeholder="Todos"
                  options={allSocios.map(s => ({ value: s as string, label: s as string }))}
                />
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                <MultiFilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
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

          {/* Distribuição de Tipos Ocultada - Passou para colunas */}

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
              <div className="overflow-x-auto custom-scrollbar p-0 sm:p-5">
                <div className="min-w-[800px] rounded-t-2xl overflow-hidden border border-[#ffffff10] shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Sócio / Líder Responsável</th>
                        <th className="p-4 text-center border-x border-[#ffffff10] align-middle">
                           <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Ativos</div>
                           <div className="text-[8px] font-bold text-blue-200 mt-1 uppercase tracking-tight">(Soma: Admin + Judic + Arb)</div>
                        </th>
                        <th className="p-4 text-center text-[10px] font-black text-white uppercase tracking-widest">Admin.</th>
                        <th className="p-4 text-center text-[10px] font-black text-white uppercase tracking-widest">Judic.</th>
                        <th className="p-4 text-center text-[10px] font-black text-white uppercase tracking-widest border-r border-[#ffffff10]">Arb.</th>
                        <th className="p-4 text-center text-[10px] font-black text-white uppercase tracking-widest border-r border-[#ffffff10]">Arquivados</th>
                        <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest">Representatividade na Base</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {volumetryBySocio.map(([socioName, lideres]) => (
                        <Fragment key={socioName}>
                          <tr className="bg-gray-50/80">
                            <td colSpan={7} className="p-4 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-black text-xs">
                                  {socioName === 'Sem Sócio Definido' ? '?' : socioName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-black text-[#0a192f] uppercase tracking-widest">{socioName}</span>
                                <span className="text-[10px] font-bold text-gray-500 ml-2">
                                  ({lideres.reduce((sum, l) => sum + l.count, 0).toLocaleString('pt-BR')} processos)
                                </span>
                              </div>
                            </td>
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
                              <td className="p-4 text-center border-x border-gray-50">
                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                                  {partner.ativos.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                                  {partner.administrativo.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                                  {partner.judicial.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-4 text-center border-r border-gray-50">
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-gray-200">
                                  {partner.arbitral.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-4 text-center border-r border-gray-50">
                                <span className="bg-amber-50 text-amber-900 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border border-amber-200">
                                  {partner.arquivados.toLocaleString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden max-w-[200px] border border-gray-200/50 shadow-inner">
                                    {parseFloat(partner.percentage) > 0 ? (
                                      <div
                                        className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${partner.percentage}%` }}
                                      ></div>
                                    ) : null}
                                  </div>
                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest w-12">{partner.percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </Fragment>
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