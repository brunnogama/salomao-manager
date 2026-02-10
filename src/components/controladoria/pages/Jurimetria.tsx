import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../../../lib/supabase';
import { Contract, ContractProcess } from '../types'; // Rota corrigida para a pasta pages
import { Loader2, Share2, Gavel, Scale, FileText, Maximize2, Minimize2, Search, Filter, X, Shield } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

// Interfaces de Grafo
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

interface JurimetriaProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Jurimetria({ userName, onModuleHome, onLogout }: JurimetriaProps) {
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

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
      judge: string | null;
      subject: string | null;
      court: string | null;
  }>({ judge: null, subject: null, court: null });

  // Redimensionamento dinâmico do canvas
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      setDimensions({
        w: containerRef.current.offsetWidth,
        h: containerRef.current.offsetHeight || 600
      });
    }
  }, []);

  useEffect(() => {
    checkUserRole();
    fetchJurimetriaData();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    const timer = setTimeout(handleResize, 300);
    return () => clearTimeout(timer);
  }, [isFullscreen, handleResize]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
    }
  };

  // Lógica de Processamento da Rede Neural Jurídica
  const processGraphData = useCallback((data: Contract[]) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set();

    const addNode = (id: string, group: string, label: string, val: number, details?: any) => {
      const cleanId = id.trim();
      if (!nodeIds.has(cleanId)) {
        nodes.push({ id: cleanId, group, label: label.trim().toUpperCase(), val, ...details });
        nodeIds.add(cleanId);
      } else {
        const node = nodes.find(n => n.id === cleanId);
        if (node) node.val += 0.5; 
      }
      return cleanId;
    };

    data.forEach(c => {
      const contractId = `C-${c.id}`;
      addNode(contractId, 'contract', c.client_name, 10, { fullData: c });

      if (c.processes && Array.isArray(c.processes)) {
        c.processes.forEach((p: ContractProcess) => {
          if (p.magistrates && Array.isArray(p.magistrates)) {
            p.magistrates.forEach(m => {
              if (m.name) {
                const judgeId = `J-${m.name.trim()}`;
                addNode(judgeId, 'judge', m.name, 6, { role: m.title });
                links.push({ source: contractId, target: judgeId, type: 'judged_by' });
              }
            });
          }
          if (p.subject) {
            const subjects = p.subject.split(';');
            subjects.forEach(s => {
                const cleanSubj = s.trim();
                if (cleanSubj) {
                    const subjectId = `S-${cleanSubj}`;
                    addNode(subjectId, 'subject', cleanSubj, 4);
                    links.push({ source: contractId, target: subjectId, type: 'about' });
                }
            });
          }
          if (p.court) {
            const courtId = `T-${p.court.trim()}`;
            addNode(courtId, 'court', p.court, 4);
            links.push({ source: contractId, target: courtId, type: 'at' });
          }
        });
      }
    });

    setFullGraphData({ nodes, links });
    setFilteredGraphData({ nodes, links });
  }, []);

  const fetchJurimetriaData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('contracts').select(`*, processes:contract_processes(*)`).eq('status', 'active');
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

  // Aplicação de Filtros de Grafo
  useEffect(() => {
    if (fullGraphData.nodes.length === 0) return;
    let nodes = [...fullGraphData.nodes];
    let links = [...fullGraphData.links];

    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchingNodes = new Set(nodes.filter(n => n.label.toLowerCase().includes(lowerSearch)).map(n => n.id));
        if (matchingNodes.size > 0) {
            const connectedNodes = new Set(matchingNodes);
            const visibleLinks = links.filter(l => {
                const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
                const isMatch = matchingNodes.has(s) || matchingNodes.has(t);
                if (isMatch) { connectedNodes.add(s); connectedNodes.add(t); }
                return isMatch;
            });
            nodes = nodes.filter(n => connectedNodes.has(n.id));
            links = visibleLinks;
        }
    }

    if (selectedFilters.judge || selectedFilters.subject || selectedFilters.court) {
        const filterIds = new Set<string>();
        if (selectedFilters.judge) filterIds.add(`J-${selectedFilters.judge}`);
        if (selectedFilters.subject) filterIds.add(`S-${selectedFilters.subject}`);
        if (selectedFilters.court) filterIds.add(`T-${selectedFilters.court}`);

        const relevantNodes = new Set(filterIds);
        const directLinks = links.filter(l => {
            const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
            return filterIds.has(s) || filterIds.has(t);
        });

        directLinks.forEach(l => {
             relevantNodes.add(typeof l.source === 'object' ? (l.source as any).id : l.source);
             relevantNodes.add(typeof l.target === 'object' ? (l.target as any).id : l.target);
        });

        nodes = nodes.filter(n => relevantNodes.has(n.id));
        links = directLinks;
    }

    setFilteredGraphData({ nodes, links });
  }, [searchTerm, selectedFilters, fullGraphData]);

  // Estatísticas de Top 10
  const stats = useMemo(() => {
    const counts = { judges: {} as any, subjects: {} as any, courts: {} as any };
    contracts.forEach(c => {
      c.processes?.forEach((p: any) => {
        if (p.subject) p.subject.split(';').forEach((s:string) => { const st = s.trim(); if(st) counts.subjects[st] = (counts.subjects[st] || 0) + 1; });
        if (p.court) counts.courts[p.court.trim()] = (counts.courts[p.court.trim()] || 0) + 1;
        p.magistrates?.forEach((m: any) => { if (m.name) counts.judges[m.name.trim()] = (counts.judges[m.name.trim()] || 0) + 1; });
      });
    });
    const sort = (obj: any) => Object.entries(obj).sort(([,a]:any, [,b]:any) => b - a).slice(0, 10);
    return { topJudges: sort(counts.judges), topSubjects: sort(counts.subjects), topCourts: sort(counts.courts) };
  }, [contracts]);

  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    let color = '#0a192f';
    switch(node.group) {
        case 'judge': color = '#b45309'; break;
        case 'subject': color = '#10b981'; break;
        case 'court': color = '#64748b'; break;
    }
    const radius = Math.sqrt(node.val) * 2;
    ctx.beginPath(); ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color; ctx.fill();

    if (globalScale > 1.5 || node.group === 'contract' || node === selectedNode) {
        const fontSize = 10 / globalScale;
        ctx.font = `bold ${fontSize}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#334155'; ctx.fillText(node.label, node.x, node.y + radius + 2);
    }
  }, [selectedNode]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-20">
      <Loader2 className="w-12 h-12 text-[#0a192f] animate-spin" />
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Mapeando Conexões Estratégicas...</p>
    </div>
  );

  return (
    <div className={`p-8 animate-in fade-in duration-500 h-full flex flex-col bg-[#f8fafc] min-h-screen ${isFullscreen ? 'fixed inset-0 z-[100] p-0' : ''}`}>
      
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 ${isFullscreen ? 'p-10 bg-[#0a192f] shadow-2xl' : ''}`}>
        <div>
          <h1 className={`text-sm font-black uppercase tracking-[0.4em] flex items-center gap-4 ${isFullscreen ? 'text-white' : 'text-[#0a192f]'}`}>
            <div className="p-2 bg-amber-500 rounded-lg shadow-lg"><Share2 className="w-5 h-5 text-[#0a192f]" /></div>
            Jurimetria & Inteligência de Rede
          </h1>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-3 ml-[52px] ${isFullscreen ? 'text-gray-400' : 'text-gray-400'}`}>Visualização gráfica de precedentes e correlações.</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="BUSCAR MAGISTRADO OU TESE..." 
                    className="pl-11 pr-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest w-full md:w-72 outline-none border border-gray-200 focus:border-[#0a192f] shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"><X size={14}/></button>}
            </div>
            <button onClick={() => setIsFullscreen(!isFullscreen)} className={`p-3 rounded-xl transition-all shadow-xl active:scale-95 ${isFullscreen ? 'bg-amber-500 text-[#0a192f]' : 'bg-[#0a192f] text-white'}`}>
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-8 flex-1 min-h-0 ${isFullscreen ? 'px-10 pb-10' : ''}`}>
        
        {/* Painel Lateral de Métricas */}
        <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6"><Gavel className="w-4 h-4 text-amber-500" /> Top Magistrados</h3>
                <div className="space-y-2">
                    {stats.topJudges.map(([name, count], i) => (
                        <div key={i} onClick={() => setSelectedFilters(p => ({...p, judge: p.judge === name ? null : name}))} className={`flex justify-between items-center p-3 rounded-xl cursor-pointer border transition-all ${selectedFilters.judge === name ? 'bg-amber-50 border-amber-200 shadow-inner' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                            <span className="text-[10px] font-black text-[#0a192f] uppercase truncate w-40">{name}</span>
                            <span className="bg-[#0a192f] text-white text-[9px] px-2 py-0.5 rounded-lg font-black">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6"><FileText className="w-4 h-4 text-emerald-500" /> Teses Jurídicas</h3>
                <div className="space-y-2">
                    {stats.topSubjects.map(([name, count], i) => (
                        <div key={i} onClick={() => setSelectedFilters(p => ({...p, subject: p.subject === name ? null : name}))} className={`flex justify-between items-center p-3 rounded-xl cursor-pointer border transition-all ${selectedFilters.subject === name ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                            <span className="text-[10px] font-black text-[#0a192f] uppercase truncate w-40">{name}</span>
                            <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-lg font-black">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Workspace do Grafo */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden group/graph" ref={containerRef}>
            <div className="absolute top-6 right-6 z-10 flex gap-2">
                <button onClick={() => { setSelectedFilters({judge:null, court:null, subject:null}); setSearchTerm(''); }} className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm hover:bg-gray-50 transition-all" title="Resetar Grafo"><X size={16} className="text-gray-400" /></button>
            </div>

            {selectedNode && (
                <div className="absolute bottom-8 left-8 z-10 bg-[#0a192f] p-8 rounded-[2.5rem] shadow-2xl max-w-sm animate-in slide-in-from-bottom-10 border border-white/10">
                    <button onClick={() => setSelectedNode(null)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20}/></button>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-lg">Identificador de Nó</span>
                    <h4 className="font-black text-white text-md mt-4 uppercase leading-tight tracking-tighter">{selectedNode.label}</h4>
                    <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                        <div className="flex justify-between">
                            <span className="text-[9px] font-black text-white/30 uppercase">Categoria</span>
                            <span className="text-[10px] font-black text-white uppercase">{selectedNode.group}</span>
                        </div>
                        {selectedNode.fullData && (
                            <div className="flex justify-between">
                                <span className="text-[9px] font-black text-white/30 uppercase">Status do Caso</span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase">{selectedNode.fullData.status}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ForceGraph2D
                ref={graphRef}
                width={dimensions.w}
                height={dimensions.h}
                graphData={filteredGraphData}
                nodeCanvasObject={drawNode}
                nodeRelSize={6}
                linkColor={() => '#e2e8f0'}
                linkWidth={1.5}
                onNodeClick={(node) => {
                    setSelectedNode(node);
                    graphRef.current?.centerAt(node.x, node.y, 800);
                    graphRef.current?.zoom(3.5, 800);
                }}
                cooldownTicks={100}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
            />
        </div>
      </div>
    </div>
  );
}