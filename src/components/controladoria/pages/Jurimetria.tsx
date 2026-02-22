import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../../../lib/supabase';
import { Contract, ContractProcess } from '../../../types/controladoria';
import {
  Loader2, Share2, Gavel, Scale, FileText, Maximize2,
  Minimize2, Search, Filter, X
} from 'lucide-react';
// Sobe um nível para sair de /pages e entra em /ui (ambos dentro de controladoria)
import { EmptyState } from '../ui/EmptyState';

// Interfaces
interface GraphNode {
  id: string;
  group: string; // 'contract' | 'judge' | 'subject' | 'court'
  label: string;
  val: number;
  fullData?: any;
  role?: string;
  x?: number;
  y?: number;
  color?: string;
  hidden?: boolean;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  hidden?: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface StatsCount {
  judges: Record<string, number>;
  subjects: Record<string, number>;
  courts: Record<string, number>;
}

export function Jurimetria() {
  // --- ROLE STATE ---
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [fullGraphData, setFullGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [filteredGraphData, setFilteredGraphData] = useState<GraphData>({ nodes: [], links: [] });

  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
    judge: string | null;
    subject: string | null;
    court: string | null;
  }>({ judge: null, subject: null, court: null });

  useEffect(() => {
    fetchJurimetriaData();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTimeout(handleResize, 500);
  }, [isFullscreen]);



  // Aplicar Filtros
  useEffect(() => {
    if (fullGraphData.nodes.length === 0) return;

    let nodes = fullGraphData.nodes;
    let links = fullGraphData.links;

    // Filtro de Texto Global (Busca)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchingNodes = new Set(
        nodes.filter(n => n.label.toLowerCase().includes(lowerSearch)).map(n => n.id)
      );

      if (matchingNodes.size > 0) {
        const connectedNodes = new Set(matchingNodes);
        const visibleLinks = links.filter(l => {
          const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;

          const isMatch = matchingNodes.has(sourceId) || matchingNodes.has(targetId);
          if (isMatch) {
            connectedNodes.add(sourceId);
            connectedNodes.add(targetId);
          }
          return isMatch;
        });

        nodes = nodes.filter(n => connectedNodes.has(n.id));
        links = visibleLinks;
      }
    }

    // Filtros Específicos (Click nos Cards)
    if (selectedFilters.judge || selectedFilters.subject || selectedFilters.court) {
      const filterNodes = new Set<string>();

      if (selectedFilters.judge) filterNodes.add(`J-${selectedFilters.judge}`);
      if (selectedFilters.subject) filterNodes.add(`S-${selectedFilters.subject}`);
      if (selectedFilters.court) filterNodes.add(`T-${selectedFilters.court}`);

      const relevantNodes = new Set(filterNodes);

      const directLinks = links.filter(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return filterNodes.has(s) || filterNodes.has(t);
      });

      directLinks.forEach(l => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
        relevantNodes.add(s);
        relevantNodes.add(t);
      });

      nodes = nodes.filter(n => relevantNodes.has(n.id));
      links = directLinks;
    }

    setFilteredGraphData({ nodes, links });

    if ((searchTerm || selectedFilters.judge || selectedFilters.subject || selectedFilters.court) && graphRef.current) {
      setTimeout(() => graphRef.current.zoomToFit(400, 50), 200);
    }

  }, [searchTerm, selectedFilters, fullGraphData]);


  const handleResize = () => {
    if (containerRef.current) {
      setDimensions({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight
      });
    }
  };

  const fetchJurimetriaData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select(`*, processes:contract_processes(*)`)
        .eq('status', 'active');

      if (error) throw error;
      if (data) {
        setContracts(data);
        processGraphData(data);
      }
    } catch (error) {
      console.error("Erro Jurimetria:", error);
    } finally {
      setLoading(false);
    }
  };

  const processGraphData = (data: Contract[]) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set();

    const addNode = (id: string, group: string, label: string, val: number, details?: any) => {
      const cleanId = id.trim();
      if (!nodeIds.has(cleanId)) {
        nodes.push({ id: cleanId, group, label: label.trim(), val, ...details });
        nodeIds.add(cleanId);
      } else {
        const node = nodes.find(n => n.id === cleanId);
        if (node) node.val += 0.5;
      }
      return cleanId;
    };

    data.forEach(c => {
      const contractId = `C-${c.id}`;
      addNode(contractId, 'contract', c.client_name, 8, { fullData: c });

      if (c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach(m => {
              if (m.name) {
                const judgeId = `J-${m.name.trim()}`;
                addNode(judgeId, 'judge', m.name, 5, { role: m.title });
                links.push({ source: contractId, target: judgeId, type: 'judged_by' });
              }
            });
          }
          if (p.subject) {
            const subjectId = `S-${p.subject.trim()}`;
            addNode(subjectId, 'subject', p.subject, 3);
            links.push({ source: contractId, target: subjectId, type: 'about' });
          }
          if (p.court) {
            const courtId = `T-${p.court.trim()}`;
            addNode(courtId, 'court', p.court, 3);
            links.push({ source: contractId, target: courtId, type: 'at' });
          }
        });
      }
    });

    setFullGraphData({ nodes, links });
    setFilteredGraphData({ nodes, links });
  };

  // --- Estatísticas ---
  const stats = useMemo(() => {
    const counts: StatsCount = { judges: {}, subjects: {}, courts: {} };
    contracts.forEach(c => {
      if (c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          if (p.subject) counts.subjects[p.subject.trim()] = (counts.subjects[p.subject.trim()] || 0) + 1;
          if (p.court) counts.courts[p.court.trim()] = (counts.courts[p.court.trim()] || 0) + 1;
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach((m: any) => {
              if (m.name) counts.judges[m.name.trim()] = (counts.judges[m.name.trim()] || 0) + 1;
            });
          }
        });
      }
    });
    const sortObj = (obj: Record<string, number>) => Object.entries(obj).sort(([, a], [, b]) => b - a).slice(0, 10);
    return {
      topJudges: sortObj(counts.judges),
      topSubjects: sortObj(counts.subjects),
      topCourts: sortObj(counts.courts)
    };
  }, [contracts]);

  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    let color = '#ccc';
    switch (node.group) {
      case 'contract': color = '#0a192f'; break;
      case 'judge': color = '#1e3a8a'; break;
      case 'subject': color = '#10b981'; break;
      case 'court': color = '#6366f1'; break;
    }
    node.color = color;
    const radius = 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    if (globalScale > 1.2 || node.group === 'contract' || node.group === 'judge' || node === selectedNode) {
      ctx.font = `bold ${fontSize}px Inter, Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#0a192f';
      ctx.fillText(label, node.x, node.y + radius + 1);
    }
  }, [selectedNode]);

  const toggleFilter = (type: 'judge' | 'subject' | 'court', value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: prev[type] === value ? null : value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilters({ judge: null, subject: null, court: null });
    graphRef.current?.zoomToFit(400);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 gap-4">
      <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Processando correlações...</p>
    </div>
  );

  return (
    <div className={`flex flex-col h-screen bg-gray-50 p-6 space-y-6 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 p-0' : ''}`}>

      {/* 1. Header - Salomão Design System */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${isFullscreen ? 'rounded-none border-x-0 border-t-0' : ''}`}>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-2.5 sm:p-3 shadow-lg shrink-0">
            <Share2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Jurimetria</h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">Análise de Conexões & Processos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">


          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar nó ou termo..."
              className="pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold w-full sm:w-48 md:w-64 outline-none focus:border-[#1e3a8a] transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {(searchTerm || selectedFilters.judge || selectedFilters.subject || selectedFilters.court) && (
              <button onClick={clearFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button onClick={() => { setIsFullscreen(!isFullscreen); setTimeout(handleResize, 100); }} className="p-2.5 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 border border-gray-200 bg-white rounded-xl transition-all shadow-sm">
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>


        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Sidebar de Estatísticas */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-amber-500"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Gavel className="w-4 h-4 text-amber-500" /> Top Magistrados
            </h3>
            <div className="space-y-1.5">
              {stats.topJudges.length > 0 ? stats.topJudges.map(([name, count], i) => (
                <div
                  key={i}
                  onClick={() => toggleFilter('judge', name)}
                  className={`flex justify-between items-center px-3 py-2 rounded-xl cursor-pointer transition-all border ${selectedFilters.judge === name ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-[11px] font-bold truncate flex-1 pr-2 uppercase tracking-tight">{name}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${selectedFilters.judge === name ? 'bg-amber-200' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                </div>
              )) : <p className="text-[10px] font-black text-gray-300 uppercase italic">Sem dados...</p>}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-blue-500"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-blue-500" /> Assuntos Principais
            </h3>
            <div className="space-y-1.5">
              {stats.topSubjects.length > 0 ? stats.topSubjects.map(([name, count], i) => (
                <div
                  key={i}
                  onClick={() => toggleFilter('subject', name)}
                  className={`flex justify-between items-center px-3 py-2 rounded-xl cursor-pointer transition-all border ${selectedFilters.subject === name ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-[11px] font-bold truncate flex-1 pr-2 uppercase tracking-tight">{name}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${selectedFilters.subject === name ? 'bg-blue-200' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                </div>
              )) : <p className="text-[10px] font-black text-gray-300 uppercase italic">Sem dados...</p>}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500"></div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-emerald-500" /> Tribunais Atuantes
            </h3>
            <div className="space-y-1.5">
              {stats.topCourts.length > 0 ? stats.topCourts.map(([name, count], i) => (
                <div
                  key={i}
                  onClick={() => toggleFilter('court', name)}
                  className={`flex justify-between items-center px-3 py-2 rounded-xl cursor-pointer transition-all border ${selectedFilters.court === name ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="text-[11px] font-bold truncate flex-1 pr-2 uppercase tracking-tight">{name}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${selectedFilters.court === name ? 'bg-emerald-200' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                </div>
              )) : <p className="text-[10px] font-black text-gray-300 uppercase italic">Sem dados...</p>}
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col" ref={containerRef}>

          <div className="absolute top-5 left-5 z-10 flex flex-wrap gap-2 pointer-events-none">
            <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-2 shadow-sm text-[#0a192f]"><span className="w-2 h-2 rounded-full bg-[#0a192f]"></span> Contrato</span>
            <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-2 shadow-sm text-[#1e3a8a]"><span className="w-2 h-2 rounded-full bg-[#1e3a8a]"></span> Magistrado</span>
            <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-2 shadow-sm text-[#10b981]"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Assunto</span>
            <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-2 shadow-sm text-[#6366f1]"><span className="w-2 h-2 rounded-full bg-[#6366f1]"></span> Tribunal</span>
          </div>

          {filteredGraphData.nodes.length === 0 && !loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <EmptyState
                icon={Filter}
                title="Filtro sem correspondência"
                description="Não encontramos conexões para os termos selecionados. Tente ajustar os filtros ou a busca."
                actionLabel="Resetar Visão"
                onAction={clearFilters}
              />
            </div>
          )}

          {selectedNode && (
            <div className="absolute bottom-6 left-6 z-10 bg-[#0a192f]/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/10 max-w-xs animate-in fade-in slide-in-from-bottom-4">
              <button onClick={() => setSelectedNode(null)} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
              <h4 className="font-black text-white text-sm mb-1 uppercase tracking-tight leading-tight">{selectedNode.label}</h4>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                {selectedNode.group === 'contract' ? 'Processo/Contrato' : selectedNode.group === 'judge' ? 'Magistrado' : selectedNode.group === 'subject' ? 'Matéria Jurídica' : 'Instância/Tribunal'}
              </span>

              {selectedNode.group === 'contract' && selectedNode.fullData && (
                <div className="mt-4 space-y-3">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Honorários Pró-Labore</p>
                    <p className="text-sm font-black text-emerald-400">{selectedNode.fullData.pro_labore ? selectedNode.fullData.pro_labore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ -'}</p>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Atual</p>
                      <p className="text-[10px] font-bold text-gray-100 uppercase tracking-tight">{selectedNode.fullData.status}</p>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <ForceGraph2D
            ref={graphRef}
            width={dimensions.w}
            height={dimensions.h}
            graphData={filteredGraphData}
            nodeCanvasObject={drawNode}
            nodeRelSize={6}
            linkColor={() => '#f1f5f9'}
            linkWidth={1.5}
            onNodeClick={(node) => {
              setSelectedNode(node);
              graphRef.current?.centerAt(node.x, node.y, 1000);
              graphRef.current?.zoom(4, 2000);
            }}
            cooldownTicks={100}
            onEngineStop={() => {
              if (filteredGraphData.nodes.length > 0 && !searchTerm && !selectedFilters.judge) {
                graphRef.current?.zoomToFit(400);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}