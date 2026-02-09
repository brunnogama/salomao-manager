import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../../../lib/supabase';
import { Contract, ContractProcess } from '../../../types/controladoria';
import { Loader2, Share2, Gavel, Scale, FileText, Maximize2, Minimize2, Search, Filter, X, Shield } from 'lucide-react';
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
  hidden?: boolean; // Para filtro
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  hidden?: boolean; // Para filtro
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

interface JurimetriaProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Jurimetria({ userName, onModuleHome, onLogout }: JurimetriaProps) {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

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
    checkUserRole();
    fetchJurimetriaData();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTimeout(handleResize, 500);
  }, [containerRef.current, isFullscreen]);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  // Aplicar Filtros
  useEffect(() => {
    if (fullGraphData.nodes.length === 0) return;

    let nodes = fullGraphData.nodes;
    let links = fullGraphData.links;

    // Filtro de Texto Global (Busca)
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        // Encontra nós que dão match
        const matchingNodes = new Set(
            nodes.filter(n => n.label.toLowerCase().includes(lowerSearch)).map(n => n.id)
        );
        
        // Se encontrou algo, mostra esses nós e seus vizinhos diretos
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
        
        // Identificar IDs dos filtros selecionados
        if (selectedFilters.judge) filterNodes.add(`J-${selectedFilters.judge}`);
        if (selectedFilters.subject) filterNodes.add(`S-${selectedFilters.subject}`);
        if (selectedFilters.court) filterNodes.add(`T-${selectedFilters.court}`);

        // Encontrar vizinhos (contratos) e vizinhos dos vizinhos
        const relevantNodes = new Set(filterNodes);
        
        // Passo 1: Links diretos dos filtros (Filtro -> Contrato)
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

        // Filtrar
        nodes = nodes.filter(n => relevantNodes.has(n.id));
        links = directLinks;
    }

    setFilteredGraphData({ nodes, links });
    
    // Auto-zoom se filtrou
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
    setFilteredGraphData({ nodes, links }); // Inicialmente igual
  };

  // --- Estatísticas ---
  const stats = useMemo(() => {
    const counts: StatsCount = { judges: {}, subjects: {}, courts: {} };
    contracts.forEach(c => {
      if(c.processes && Array.isArray(c.processes)) {
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
    const sortObj = (obj: Record<string, number>) => Object.entries(obj).sort(([,a], [,b]) => b - a).slice(0, 10);
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
    switch(node.group) {
        case 'contract': color = '#0a192f'; break; // Manager Navy
        case 'judge': color = '#b45309'; break;    // Manager Gold
        case 'subject': color = '#10b981'; break;
        case 'court': color = '#64748b'; break;
    }
    node.color = color;
    const radius = 5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    if (globalScale > 1.2 || node.group === 'contract' || node.group === 'judge' || node === selectedNode) {
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(label.toUpperCase(), node.x, node.y + radius + 2);
    }
  }, [selectedNode]);

  // Handler para toggles de filtro
  const toggleFilter = (type: 'judge' | 'subject' | 'court', value: string) => {
      setSelectedFilters(prev => ({
          ...prev,
          [type]: prev[type] === value ? null : value // Toggle
      }));
  };

  const clearFilters = () => {
      setSearchTerm('');
      setSelectedFilters({ judge: null, subject: null, court: null });
      graphRef.current?.zoomToFit(400);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Loader2 className="w-10 h-10 text-[#0a192f] animate-spin" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Rede Neural...</p>
    </div>
  );

  return (
    <div className={`p-8 animate-in fade-in duration-500 h-full flex flex-col bg-gray-50/50 min-h-screen ${isFullscreen ? 'fixed inset-0 z-[100] bg-[#F8FAFC] p-0' : ''}`}>
      
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 ${isFullscreen ? 'p-8 bg-[#0a192f] shadow-2xl' : ''}`}>
        <div>
          <h1 className={`text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 ${isFullscreen ? 'text-white' : 'text-[#0a192f]'}`}>
            <Share2 className="w-6 h-6 text-amber-500" /> Jurimetria & Conexões
          </h1>
          <div className="flex items-center gap-3 mt-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isFullscreen ? 'text-gray-400' : 'text-gray-400'}`}>Mapeamento gráfico de correlações judiciais.</p>
                {userRole && !isFullscreen && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                        userRole === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                        <Shield className="w-3 h-3" />
                        {userRole === 'admin' ? 'Administrador' : 'Visualizador'}
                    </span>
                )}
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isFullscreen ? 'text-gray-500' : 'text-gray-300'}`} />
                <input 
                    type="text" 
                    placeholder="BUSCAR NÓ..." 
                    className={`pl-11 pr-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest w-full md:w-64 outline-none transition-all shadow-sm ${
                      isFullscreen 
                        ? 'bg-white/10 border-white/10 text-white focus:bg-white/20' 
                        : 'bg-white border-gray-200 text-[#0a192f] focus:border-[#0a192f]'
                    }`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {(searchTerm || selectedFilters.judge || selectedFilters.subject || selectedFilters.court) && (
                    <button onClick={clearFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                )}
            </div>

            <button onClick={() => { setIsFullscreen(!isFullscreen); setTimeout(handleResize, 100); }} className={`p-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${isFullscreen ? 'bg-amber-500 text-[#0a192f]' : 'bg-[#0a192f] text-white hover:bg-slate-800'}`}>
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-8 flex-1 min-h-0 ${isFullscreen ? 'px-8 pb-8' : ''}`}>
        
        {/* Painel Esquerdo - Estatísticas */}
        <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            {/* Card Juízes */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-5"><Gavel className="w-4 h-4 text-amber-500" /> Top Magistrados</h3>
                <div className="space-y-2">
                    {stats.topJudges.length > 0 ? stats.topJudges.map(([name, count], i) => (
                        <div 
                            key={i} 
                            onClick={() => toggleFilter('judge', name)}
                            className={`flex justify-between items-center text-[11px] p-2.5 rounded-xl cursor-pointer transition-all border font-bold uppercase tracking-tight ${selectedFilters.judge === name ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-inner' : 'bg-gray-50/50 border-transparent text-gray-600 hover:bg-gray-100'}`}
                        >
                            <span className="truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${selectedFilters.judge === name ? 'bg-amber-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>{count}</span>
                        </div>
                    )) : <p className="text-[10px] font-bold text-gray-300 uppercase italic">Dados insuficientes.</p>}
                </div>
            </div>

            {/* Card Assuntos */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-5"><FileText className="w-4 h-4 text-blue-500" /> Assuntos</h3>
                <div className="space-y-2">
                    {stats.topSubjects.length > 0 ? stats.topSubjects.map(([name, count], i) => (
                        <div 
                            key={i} 
                            onClick={() => toggleFilter('subject', name)}
                            className={`flex justify-between items-center text-[11px] p-2.5 rounded-xl cursor-pointer transition-all border font-bold uppercase tracking-tight ${selectedFilters.subject === name ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner' : 'bg-gray-50/50 border-transparent text-gray-600 hover:bg-gray-100'}`}
                        >
                            <span className="truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${selectedFilters.subject === name ? 'bg-blue-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>{count}</span>
                        </div>
                    )) : <p className="text-[10px] font-bold text-gray-300 uppercase italic">Dados insuficientes.</p>}
                </div>
            </div>

             {/* Card Tribunais */}
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-5"><Scale className="w-4 h-4 text-emerald-500" /> Tribunais</h3>
                <div className="space-y-2">
                    {stats.topCourts.length > 0 ? stats.topCourts.map(([name, count], i) => (
                        <div 
                            key={i} 
                            onClick={() => toggleFilter('court', name)}
                            className={`flex justify-between items-center text-[11px] p-2.5 rounded-xl cursor-pointer transition-all border font-bold uppercase tracking-tight ${selectedFilters.court === name ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner' : 'bg-gray-50/50 border-transparent text-gray-600 hover:bg-gray-100'}`}
                        >
                            <span className="truncate flex-1 pr-2" title={name}>{name}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${selectedFilters.court === name ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>{count}</span>
                        </div>
                    )) : <p className="text-[10px] font-bold text-gray-300 uppercase italic">Dados insuficientes.</p>}
                </div>
            </div>
        </div>

        {/* Área do Grafo */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden flex flex-col group/graph" ref={containerRef}>
            
            {/* Legenda Flutuante */}
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-none opacity-0 group-hover/graph:opacity-100 transition-opacity duration-500">
                <span className="bg-[#0a192f]/90 backdrop-blur px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-3 shadow-2xl border border-white/10"><span className="w-2.5 h-2.5 rounded-full bg-white"></span> Contrato</span>
                <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[9px] font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-3 shadow-2xl border border-gray-100"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Juiz</span>
                <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[9px] font-black text-[#0a192f] uppercase tracking-widest flex items-center gap-3 shadow-2xl border border-gray-100"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Assunto</span>
            </div>

            {/* Empty State do Grafo */}
            {filteredGraphData.nodes.length === 0 && !loading && (
                 <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <EmptyState 
                          icon={Filter} 
                          title="Nenhum dado encontrado" 
                          description="Não encontramos conexões para os filtros aplicados."
                          actionLabel="Limpar Rede"
                          onAction={clearFilters}
                      />
                 </div>
            )}

            {/* Detalhes do Nó Selecionado */}
            {selectedNode && (
                <div className="absolute bottom-8 left-8 z-10 bg-[#0a192f] p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-sm animate-in slide-in-from-bottom-10 border border-white/10">
                    <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                    <h4 className="font-black text-white text-sm mb-2 uppercase tracking-tight leading-tight">{selectedNode.label}</h4>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 bg-white/5 px-3 py-1 rounded-lg border border-amber-500/20">{selectedNode.group === 'contract' ? 'Processo/Contrato' : selectedNode.group === 'judge' ? 'Poder Judiciário' : selectedNode.group === 'subject' ? 'Tese Jurídica' : 'Competência'}</span>
                    
                    {selectedNode.group === 'contract' && selectedNode.fullData && (
                        <div className="mt-6 space-y-3 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Valor de Causa</span>
                              <span className="text-xs font-black text-emerald-400">{selectedNode.fullData.pro_labore ? Number(selectedNode.fullData.pro_labore).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status Atual</span>
                              <span className="text-[10px] font-black text-white uppercase bg-white/10 px-2 py-0.5 rounded-lg">{selectedNode.fullData.status}</span>
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