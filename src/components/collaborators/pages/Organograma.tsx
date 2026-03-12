import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useColaboradores } from '../hooks/useColaboradores';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Network, Search, AlertCircle, Loader2, User as UserIcon, ZoomIn, ZoomOut, Maximize, Minimize, Printer, X, Briefcase, Mail, Phone, Tag, Building2, ArrowUp } from 'lucide-react';
import { AlertModal } from '../../../components/ui/AlertModal';

// Define the exact hierarchy order for Jurídico
const JURIDICO_HIERARCHY = [
    'Sócios',
    'Consultor Jurídico',
    'Coordenador Jurídico',
    'Advogado Sênior III',
    'Advogado Sênior II',
    'Advogado Sênior I',
    'Advogado Pleno III',
    'Advogado Pleno II',
    'Advogado Pleno I',
    'Advogado Júnior III',
    'Advogado Júnior II',
    'Advogado Júnior I',
    'Estagiário',
    'Analista Jurídico',
    'Assistente Jurídico'
];

interface ColaboradorCard {
    id: string;
    name: string;
    role: string;
    equipe: string;
    atuacao: string;
    leader_id?: string;
    competencias?: string;
    photo_url?: string;
    foto_url?: string;
    isJuridico: boolean;
    isAdministrativo: boolean;
    isSocio: boolean;
    fullData?: any;
}

// Separate recursive component outside the main render loop for performance
const OrganogramNode = React.memo(({
    colab,
    context,
    visitedIds,
    level = 0,
    isDense = false,
    isSuperDense = false
}: {
    colab: ColaboradorCard,
    context: {
        activeTab: 'JURIDICO' | 'ADMINISTRATIVO',
        searchQuery: string,
        setSelectedColabForModal: (data: any) => void,
        setEditingPosition: (pos: { top: number, left: number } | null) => void,
        setEditingCompetenciasId: (id: string | null) => void,
        setEditingCompetenciasText: (text: string) => void,
        subordinatesMap: Map<string | null, ColaboradorCard[]>,
    },
    visitedIds: Set<string>,
    level?: number,
    isDense?: boolean,
    isSuperDense?: boolean
}) => {
    const { activeTab, searchQuery, setSelectedColabForModal, setEditingPosition, setEditingCompetenciasId, setEditingCompetenciasText, subordinatesMap } = context;
    const subordinates = subordinatesMap.get(colab.id) || [];
    const roleStr = colab.role;

    if (visitedIds.has(colab.id)) return null;
    const nextVisited = new Set<string>(visitedIds).add(colab.id);

    if (activeTab === 'JURIDICO' && !colab.isJuridico) return null;
    if (activeTab === 'ADMINISTRATIVO' && !colab.isAdministrativo) return null;

    const isMatch = !searchQuery ||
        colab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        colab.equipe.toLowerCase().includes(searchQuery.toLowerCase());

    const getRank = (rStr: string) => {
        const r = rStr.trim();
        const index = JURIDICO_HIERARCHY.findIndex(h => h.toLowerCase() === r.toLowerCase());
        return index === -1 ? 999 : index;
    };

    const sortedSubordinates = [...subordinates]
        .filter(c => {
            if (activeTab === 'JURIDICO') return c.isJuridico;
            if (activeTab === 'ADMINISTRATIVO') return c.isAdministrativo;
            return true;
        })
        .sort((a, b) => getRank(a.role) - getRank(b.role));

    // Conditional Layout Logic
    const isJuridicoTab = activeTab === 'JURIDICO';
    const roleGroups: ColaboradorCard[][] = [];

    if (isJuridicoTab) {
        let currentRole: string | null = null;
        let currentGroup: ColaboradorCard[] = [];

        for (const sub of sortedSubordinates) {
            if (sub.role !== currentRole) {
                if (currentGroup.length > 0) roleGroups.push(currentGroup);
                currentRole = sub.role;
                currentGroup = [sub];
            } else {
                currentGroup.push(sub);
            }
        }
        if (currentGroup.length > 0) roleGroups.push(currentGroup);
    }
    return (
        <div className={`flex flex-col items-center transition-opacity duration-300 ${!isMatch ? 'opacity-30 grayscale print:opacity-100 print:grayscale-0' : ''}`}>
            <Droppable droppableId={colab.id} type="COLAB">
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`relative flex flex-col items-center transition-all duration-300 ${isSuperDense ? 'w-[190px]' : isDense ? 'w-[220px]' : 'w-[240px]'} z-10 group hover:z-50 ${snapshot.isDraggingOver ? 'scale-105' : ''}`}
                    >
                        <div className={`absolute inset-0 -m-4 rounded-3xl transition-colors z-[-1] ${snapshot.isDraggingOver ? 'bg-[#1e3a8a]/5 border-2 border-dashed border-[#1e3a8a]/30' : 'bg-transparent'}`} />

                        <Draggable draggableId={colab.id} index={0}>
                            {(dragProvided, dragSnapshot) => (
                                <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className={`flex flex-col items-center cursor-pointer w-full ${dragSnapshot.isDragging ? 'opacity-50 scale-105' : ''}`}
                                    onClick={() => setSelectedColabForModal(colab.fullData)}
                                >
                                    <div className={`${isSuperDense ? 'w-16 h-16' : isDense ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-white shadow-md border-[3px] border-[#1e3a8a]/10 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:shadow-xl group-hover:scale-110 group-hover:border-[#1e3a8a]/30`}>
                                        {colab.photo_url ? (
                                            <img src={colab.photo_url} alt={colab.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#1e3a8a]/40">
                                                <UserIcon className={isSuperDense ? 'w-6 h-6' : isDense ? 'w-8 h-8' : 'w-10 h-10'} />
                                            </div>
                                        )}
                                    </div>

                                    <div className={`${isSuperDense ? 'mt-2' : isDense ? 'mt-3' : 'mt-4'} text-center px-1 flex flex-col items-center gap-1`}>
                                        <div>
                                            <h4 className={`${isSuperDense ? 'text-[11px]' : isDense ? 'text-[12px]' : 'text-[13px]'} leading-tight font-black text-[#0a192f] tracking-tight truncate ${isSuperDense ? 'max-w-[170px]' : isDense ? 'max-w-[200px]' : 'max-w-[200px]'}`}>{colab.name}</h4>
                                            <span className={`${isSuperDense ? 'text-[8px]' : 'text-[9px]'} font-bold uppercase tracking-widest text-[#1e3a8a] block mt-1 truncate ${isSuperDense ? 'max-w-[170px]' : isDense ? 'max-w-[200px]' : 'max-w-[200px]'}`}>{roleStr}</span>
                                        </div>
                                        {colab.equipe && colab.equipe !== 'Sem Equipe' && colab.equipe !== 'Geral' && !isSuperDense && (
                                            <span className="inline-block px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-wider text-gray-500 shadow-sm truncate max-w-[180px]">
                                                {colab.equipe}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setEditingPosition({ top: rect.top, left: rect.right + 16 });
                                            setEditingCompetenciasId(colab.id);
                                            setEditingCompetenciasText(colab.competencias || '');
                                        }}
                                        className="absolute -right-2 top-0 p-1.5 bg-white border border-gray-100 rounded-full shadow-sm text-gray-400 hover:text-[#1e3a8a] opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                    >
                                        <Tag className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </Draggable>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {sortedSubordinates.length > 0 && (
                <div className="flex flex-col items-center mt-2 w-full">
                    <div className="w-[2px] h-8 bg-gray-300"></div>
                    <div className="flex flex-col items-center w-full relative z-10">
                        {isJuridicoTab && colab.isSocio ? (
                            // JURIDICO - Sócio: all direct subordinates on the same horizontal row
                            <div className="flex justify-center relative pt-4 w-full">
                                {sortedSubordinates.map((sub, idx) => (
                                    <div key={sub.id} className={`relative flex flex-col items-center ${sortedSubordinates.length > 8 ? 'px-0' : sortedSubordinates.length > 5 ? 'px-0.5' : 'px-4'}`}>
                                        {/* Per-child horizontal segment */}
                                        {sortedSubordinates.length > 1 && (
                                            <div className="absolute h-[2px] bg-gray-300" style={{
                                                top: '-1rem',
                                                left: idx === 0 ? '50%' : '0',
                                                right: idx === sortedSubordinates.length - 1 ? '50%' : '0'
                                            }}></div>
                                        )}
                                        {/* Vertical stub up */}
                                        <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>
                                        <div style={{
                                            transform: sortedSubordinates.length > 12 ? 'scale(0.8)' : sortedSubordinates.length > 8 ? 'scale(0.85)' : sortedSubordinates.length > 5 ? 'scale(0.95)' : 'scale(1)',
                                            transformOrigin: 'top center'
                                        }}>
                                            <OrganogramNode
                                                colab={sub}
                                                context={context}
                                                visitedIds={nextVisited}
                                                level={level + 1}
                                                isDense={sortedSubordinates.length > 5 && sortedSubordinates.length <= 8}
                                                isSuperDense={sortedSubordinates.length > 8}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : isJuridicoTab ? (
                            // JURIDICO - Sub-levels: group by role vertically
                            roleGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="flex flex-col items-center w-full relative pb-16">
                                    {groupIndex < roleGroups.length - 1 && (
                                        <div className="absolute top-0 left-1/2 w-[2px] h-full bg-gray-300 -translate-x-1/2 -z-10"></div>
                                    )}
                                    <div className="flex justify-center relative pt-4 w-full">
                                        {group.map((sub, idx) => (
                                            <div key={sub.id} className={`relative flex flex-col items-center ${group.length > 8 ? 'px-0' : group.length > 5 ? 'px-0.5' : 'px-4'}`}>
                                                {/* Per-child horizontal segment */}
                                                {group.length > 1 && (
                                                    <div className="absolute h-[2px] bg-gray-300" style={{
                                                        top: '-1rem',
                                                        left: idx === 0 ? '50%' : '0',
                                                        right: idx === group.length - 1 ? '50%' : '0'
                                                    }}></div>
                                                )}
                                                {/* Vertical stub up */}
                                                <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>
                                                <div style={{
                                                    transform: group.length > 12 ? 'scale(0.8)' : group.length > 8 ? 'scale(0.85)' : group.length > 5 ? 'scale(0.95)' : 'scale(1)',
                                                    transformOrigin: 'top center'
                                                }}>
                                                    <OrganogramNode
                                                        colab={sub}
                                                        context={context}
                                                        visitedIds={nextVisited}
                                                        level={level + 1}
                                                        isDense={group.length > 5 && group.length <= 8}
                                                        isSuperDense={group.length > 8}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // ADMINISTRATIVO: Unified horizontal row (peers side-by-side)
                            <div className="flex justify-center relative pt-4 w-full">
                                {sortedSubordinates.map((sub, idx) => (
                                    <div key={sub.id} className={`relative flex flex-col items-center ${sortedSubordinates.length > 8 ? 'px-0' : sortedSubordinates.length > 5 ? 'px-0.5' : 'px-4'}`}>
                                        {/* Per-child horizontal segment */}
                                        {sortedSubordinates.length > 1 && (
                                            <div className="absolute h-[2px] bg-gray-300" style={{
                                                top: '-1rem',
                                                left: idx === 0 ? '50%' : '0',
                                                right: idx === sortedSubordinates.length - 1 ? '50%' : '0'
                                            }}></div>
                                        )}
                                        {/* Vertical stub up */}
                                        <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>
                                        <div style={{
                                            transform: sortedSubordinates.length > 12 ? 'scale(0.8)' : sortedSubordinates.length > 8 ? 'scale(0.85)' : sortedSubordinates.length > 5 ? 'scale(0.95)' : 'scale(1)',
                                            transformOrigin: 'top center'
                                        }}>
                                            <OrganogramNode
                                                colab={sub}
                                                context={context}
                                                visitedIds={nextVisited}
                                                level={level + 1}
                                                isDense={sortedSubordinates.length > 5 && sortedSubordinates.length <= 8}
                                                isSuperDense={sortedSubordinates.length > 8}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

// Admin Organogram Tree: Each Atuação is its own vertical tree (divisional org chart)
const AdminOrganogramTree = React.memo(({
    diretorFinanceiro,
    allAdminColabs,
    context,
    selectedAtuacao = 'ALL'
}: {
    diretorFinanceiro: ColaboradorCard,
    allAdminColabs: ColaboradorCard[],
    context: {
        activeTab: 'JURIDICO' | 'ADMINISTRATIVO',
        searchQuery: string,
        setSelectedColabForModal: (data: any) => void,
        setEditingPosition: (pos: { top: number, left: number } | null) => void,
        setEditingCompetenciasId: (id: string | null) => void,
        setEditingCompetenciasText: (text: string) => void,
        subordinatesMap: Map<string | null, ColaboradorCard[]>,
    },
    selectedAtuacao?: string | 'ALL'
}) => {
    const { setSelectedColabForModal } = context;

    // Group collaborators by Atuação
    const atuacaoGroups = useMemo(() => {
        const groups = new Map<string, ColaboradorCard[]>();
        allAdminColabs.forEach(c => {
            if (c.id === diretorFinanceiro.id) return;
            const key = c.atuacao || 'Sem Atuação';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(c);
        });
        return groups;
    }, [allAdminColabs, diretorFinanceiro.id]);

    // For each Atuação group, find the top-level collaborators
    const getTopLevelInGroup = useCallback((colabs: ColaboradorCard[]) => {
        const groupIds = new Set(colabs.map(c => c.id));
        return colabs.filter(c => {
            if (c.leader_id === diretorFinanceiro.id) return true;
            if (!c.leader_id) return true;
            if (!groupIds.has(c.leader_id)) return true;
            return false;
        });
    }, [diretorFinanceiro.id]);

    const atuacaoEntriesAll = Array.from(atuacaoGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const atuacaoEntries = selectedAtuacao === 'ALL'
        ? atuacaoEntriesAll
        : atuacaoEntriesAll.filter(([name]) => name === selectedAtuacao);

    // Reusable Diretor Financeiro mini-node (Droppable)
    const DiretorSection = ({ atuacaoName }: { atuacaoName: string }) => (
        <Droppable droppableId={`root:${diretorFinanceiro.id}:${atuacaoName}`} type="COLAB">
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col items-center p-6 rounded-[2.5rem] transition-all duration-300 ${snapshot.isDraggingOver ? 'bg-[#1e3a8a]/5 scale-105 border-2 border-dashed border-[#1e3a8a]/20' : 'bg-transparent'}`}
                >
                    <div
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => setSelectedColabForModal(diretorFinanceiro.fullData)}
                    >
                        <div className="w-24 h-24 rounded-full bg-white shadow-md border-[3px] border-[#1e3a8a]/20 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:shadow-xl group-hover:scale-110 group-hover:border-[#1e3a8a]/30">
                            {diretorFinanceiro.photo_url ? (
                                <img src={diretorFinanceiro.photo_url} alt={diretorFinanceiro.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-[#1e3a8a]/50">
                                    <UserIcon className="w-10 h-10" />
                                </div>
                            )}
                        </div>
                        <div className="mt-3 text-center">
                            <h4 className="text-[13px] font-black text-[#0a192f] tracking-tight">{diretorFinanceiro.name}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a8a] block mt-1">{diretorFinanceiro.role}</span>
                        </div>
                    </div>

                    {/* Vertical line from Director to Atuação label */}
                    <div className="w-[2px] h-8 bg-gray-300 mt-4"></div>

                    {/* Atuação Label */}
                    <div className="bg-gradient-to-r from-[#0a192f] to-[#1e3a8a] text-white px-8 py-3 rounded-2xl shadow-lg">
                        <span className="text-[12px] font-black uppercase tracking-[0.2em]">{atuacaoName}</span>
                    </div>
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );

    return (
        <div className="flex flex-col items-center gap-16 w-full">
            {atuacaoEntries.map(([atuacaoName, colabs], sectionIdx) => {
                const topLevel = getTopLevelInGroup(colabs);

                return (
                    <div key={atuacaoName} className="relative flex flex-col items-center w-full">
                        {/* Section divider between Atuações */}
                        {sectionIdx > 0 && (
                            <div className="w-full max-w-4xl h-[2px] bg-gray-200 mb-16"></div>
                        )}

                        {/* Diretor Financeiro & Atuação (repeated per section) */}
                        <DiretorSection atuacaoName={atuacaoName} />

                        {/* Vertical line from Atuação label down to collaborators */}
                        {topLevel.length > 0 && (
                            <div className="w-[2px] h-8 bg-gray-300"></div>
                        )}

                        {/* Horizontal layout for all top-level peers in this sector */}
                        {topLevel.length > 1 && (
                            <div className="flex justify-center relative pt-4 w-full">
                                {topLevel.map((colab, idx) => (
                                    <div key={colab.id} className={`relative flex flex-col items-center ${topLevel.length > 8 ? 'px-0' : topLevel.length > 5 ? 'px-0.5' : 'px-4'}`}>
                                        {/* Per-child horizontal segment */}
                                        {topLevel.length > 1 && (
                                            <div className="absolute h-[2px] bg-gray-300" style={{
                                                top: '-1rem',
                                                left: idx === 0 ? '50%' : '0',
                                                right: idx === topLevel.length - 1 ? '50%' : '0'
                                            }}></div>
                                        )}
                                        {/* Vertical stub up */}
                                        <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>
                                        <div style={{
                                            transform: topLevel.length > 12 ? 'scale(0.8)' : topLevel.length > 7 ? 'scale(0.9)' : 'scale(1)',
                                            transformOrigin: 'top center'
                                        }}>
                                            <OrganogramNode
                                                colab={colab}
                                                context={context}
                                                visitedIds={new Set<string>([diretorFinanceiro.id])}
                                                isDense={topLevel.length > 5 && topLevel.length <= 8}
                                                isSuperDense={topLevel.length > 8}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Single collaborator — no horizontal bar needed */}
                        {topLevel.length === 1 && (
                            <OrganogramNode
                                colab={topLevel[0]}
                                context={context}
                                visitedIds={new Set<string>([diretorFinanceiro.id])}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
});

export function Organograma() {
    const { colaboradores, loading: colsLoading, fetchColaboradores } = useColaboradores();
    const [data, setData] = useState<ColaboradorCard[]>([]);
    const [pendingDragResult, setPendingDragResult] = useState<DropResult | null>(null);
    const [savingCompetenciasId, setSavingCompetenciasId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [selectedColabForModal, setSelectedColabForModal] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'JURIDICO' | 'ADMINISTRATIVO'>('JURIDICO');
    const [selectedPartner, setSelectedPartner] = useState<string | 'ALL'>('ALL');
    const [selectedAtuacao, setSelectedAtuacao] = useState<string | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [editingCompetenciasId, setEditingCompetenciasId] = useState<string | null>(null);
    const [editingCompetenciasText, setEditingCompetenciasText] = useState('');
    const [editingPosition, setEditingPosition] = useState<{ top: number, left: number } | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant: 'success' | 'error' | 'info';
    }>({
        isOpen: false,
        title: '',
        description: '',
        variant: 'info'
    });

    const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, title, description, variant });
    };

    // Sync data on mount and tab change
    useEffect(() => {
        fetchColaboradores();
    }, [fetchColaboradores, activeTab]);

    // Watch scroll for Back to Top button
    useEffect(() => {
        const handleScroll = () => {
            const containerScroll = containerRef.current?.scrollTop || 0;
            const windowScroll = window.scrollY;
            setShowBackToTop(containerScroll > 300 || windowScroll > 400);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        window.addEventListener('scroll', handleScroll);

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isMaximized]);

    // Fetch atuação lookup table
    const [atuacoesMap, setAtuacoesMap] = useState<Map<string, string>>(new Map());
    useEffect(() => {
        supabase.from('atuacoes').select('id, name').then(({ data: atuData }) => {
            if (atuData) setAtuacoesMap(new Map(atuData.map(a => [String(a.id), a.name])));
        });
    }, []);

    // Filter and sort collaborators based on Jurídico hierarchy initially
    useEffect(() => {
        if (colaboradores.length > 0) {
            const mapped = colaboradores
                .filter(c => c.status === 'active')
                .map(c => {
                    const roleStr = typeof c.roles === 'object' ? (c.roles as any)?.name : (c.role as string);
                    const roleLower = String(roleStr || '').toLowerCase();
                    const isSocio = roleLower.includes('sócio') || roleLower.includes('socio');
                    const isJuridico = JURIDICO_HIERARCHY.some(h => roleLower.includes(h.toLowerCase())) ||
                        isSocio ||
                        roleLower.includes('advogado') ||
                        roleLower.includes('estagiário') ||
                        roleLower.includes('estagiario') ||
                        roleLower.includes('jurídico') ||
                        roleLower.includes('juridico');

                    // Specific check for Admin even if name contains 'Juridico'
                    const explicitlyAdmin = (String(c.equipe || '').toLowerCase().includes('adm') ||
                        String(c.atuacao || '').toLowerCase().includes('adm'));

                    const atuacaoId = String((c as any).atuacao || '');
                    const atuacaoName = atuacoesMap.get(atuacaoId) || atuacaoId || '';

                    return {
                        id: c.id,
                        name: c.name,
                        role: roleStr || 'Sem Cargo',
                        equipe: (typeof c.teams === 'object' ? (c.teams as any)?.name : c.equipe) || 'Geral',
                        atuacao: atuacaoName,
                        leader_id: c.leader_id || undefined,
                        competencias: c.competencias || '',
                        photo_url: c.photo_url || c.foto_url,
                        foto_url: c.foto_url,
                        isJuridico: isJuridico && !explicitlyAdmin,
                        isAdministrativo: !isJuridico || isSocio || explicitlyAdmin,
                        isSocio,
                        fullData: c
                    };
                });
            setData(mapped as ColaboradorCard[]);
        }
    }, [colaboradores, atuacoesMap]);

    const updateCompetencias = useCallback(async (id: string, text: string) => {
        setData(prev => prev.map(c => c.id === id ? { ...c, competencias: text } : c));
    }, []);

    const saveCompetencias = useCallback(async (id: string, text: string) => {
        try {
            setSavingCompetenciasId(id);
            const { error } = await supabase
                .from('collaborators')
                .update({ competencias: text })
                .eq('id', id);

            if (error) throw error;
            showAlert('Sucesso', 'Competências atualizadas com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving competencias:', error);
            showAlert('Erro', 'Erro ao salvar competências', 'error');
        } finally {
            setSavingCompetenciasId(null);
        }
    }, []);

    const handleDragConfirm = useCallback(async () => {
        if (!pendingDragResult) return;
        const { destination, draggableId } = pendingDragResult;
        if (!destination) return;

        const draggedColab = data.find(c => c.id === draggableId);
        if (!draggedColab) return;

        const newLeaderIdRaw = destination.droppableId;
        // Resolve root droppable IDs back to actual director ID. Format: root:DIRECTOR_ID:ATUACAO_NAME
        const isRootDrop = newLeaderIdRaw.startsWith('root:');
        let newLeaderId = isRootDrop
            ? newLeaderIdRaw.split(':')[1]
            : newLeaderIdRaw;

        const leaderToUpdate = newLeaderId === 'unassigned' ? null : newLeaderId;
        const leaderData = data.find(c => c.id === leaderToUpdate);
        const targetIsSocio = leaderData?.isSocio;

        // Resolve Atuação ID and Name
        let targetAtuacaoId: string | null = null;
        let targetAtuacaoName: string | null = null;

        if (isRootDrop) {
            targetAtuacaoName = newLeaderIdRaw.split(':')[2];
            if (targetAtuacaoName) {
                for (const [id, name] of Array.from(atuacoesMap.entries())) {
                    if (name.toLowerCase() === targetAtuacaoName.toLowerCase()) {
                        targetAtuacaoId = id;
                        break;
                    }
                }
            }
        } else if (leaderData) {
            // If dropped on a person, inherit their Atuação and Partner
            targetAtuacaoName = leaderData.atuacao;
            // Need the ID for DB update
            for (const [id, name] of Array.from(atuacoesMap.entries())) {
                if (name.toLowerCase() === (targetAtuacaoName || '').toLowerCase()) {
                    targetAtuacaoId = id;
                    break;
                }
            }
        }

        try {
            const updates: any = { leader_id: leaderToUpdate };
            // Sync partner_id
            if (targetIsSocio) {
                updates.partner_id = leaderToUpdate;
            } else if (leaderData?.fullData?.partner_id) {
                // Inherit from leader if leader is not a socio but has a partner
                updates.partner_id = leaderData.fullData.partner_id;
            }
            // Sync atuacao
            if (targetAtuacaoId) updates.atuacao = targetAtuacaoId;

            const { error } = await supabase
                .from('collaborators')
                .update(updates)
                .eq('id', draggableId);

            if (error) throw error;

            // Optimistic Update: Update local 'data' state directly
            // This ensures the UI reflects change instantly without full re-render/scroll-jump
            setData(prev => prev.map(c =>
                c.id === draggableId
                    ? {
                        ...c,
                        leader_id: leaderToUpdate || undefined,
                        // Update local partner_id
                        ...((targetIsSocio || leaderData?.fullData?.partner_id) ? { partner_id: targetIsSocio ? leaderToUpdate : leaderData?.fullData?.partner_id } : {}),
                        // Update local atuacao name
                        ...(targetAtuacaoName ? { atuacao: targetAtuacaoName } : {})
                    }
                    : c
            ));

            // Background Refetch: Ensure hook state is fully in sync with DB
            // We add a 500ms delay to allow the DB update to be ready for the select(*) in fetchColaboradores
            setTimeout(() => {
                fetchColaboradores();
            }, 500);

            const leaderToUpdateName = leaderToUpdate
                ? data.find(c => c.id === leaderToUpdate)?.name || 'novo líder'
                : 'nenhum';

            showAlert('Sucesso', `${draggedColab.name} agora responde para ${leaderToUpdateName}.`, 'success');

        } catch (error) {
            console.error('Erro ao atualizar leader_id:', error);
            showAlert('Erro', 'Erro ao alterar hierarquia.', 'error');
        } finally {
            setPendingDragResult(null);
        }
    }, [pendingDragResult, data]);

    const handleDragEnd = useCallback((result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const destId = destination.droppableId;
        const resolvedDestId = destId.startsWith('root:') ? destId.split(':')[1] : destId;
        if (draggableId === resolvedDestId) {
            showAlert('Ação Inválida', 'Um colaborador não pode ser líder dele mesmo.', 'error');
            return;
        }

        setPendingDragResult(result);
    }, []);

    // Optimized lookups: Map of LeaderId -> List of Subordinates
    const subordinatesMap = useMemo(() => {
        const map = new Map<string | null, ColaboradorCard[]>();
        data.forEach(c => {
            const lid = c.leader_id || null;
            if (!map.has(lid)) map.set(lid, []);
            map.get(lid)!.push(c);
        });
        return map;
    }, [data]);



    // Helper to check if a node or any of its descendants have administrative subordinates
    const hasAdministrativeSubordinates = useCallback((leaderId: string, visited = new Set<string>()): boolean => {
        if (visited.has(leaderId)) return false; // Cycle protection
        visited.add(leaderId);

        const subs = subordinatesMap.get(leaderId) || [];
        for (const sub of subs) {
            // If a direct subordinate is admin and not a socio, consider it
            if (sub.isAdministrativo && !sub.isSocio) return true;

            // Recursively check
            if (hasAdministrativeSubordinates(sub.id, visited)) return true;
        }
        return false;
    }, [subordinatesMap]);

    // Get Top Level Nodes (Partners or those explicitly set as top)
    const topLevelNodes = useMemo(() => {
        return data.filter(c => {
            const roleStr = String(c.role || '');
            const isSocio = roleStr.toLowerCase().includes('sócio');
            const isDiretorFinanceiro = roleStr.toLowerCase().includes('diretor financeiro');

            if (activeTab === 'ADMINISTRATIVO') {
                // Only Diretor Financeiro is root in the Administrative tree
                return isDiretorFinanceiro;
            }

            // Juridico tab
            if (isSocio) return true;
            return !c.leader_id;
        });
    }, [data, activeTab]);
    // Find pure top level nodes based on active tab
    // NOTE: These hooks MUST be before any early returns to comply with React Rules of Hooks
    const roots = useMemo(() => {
        return topLevelNodes.filter(c => {
            if (activeTab === 'JURIDICO') return c.isJuridico;
            if (activeTab === 'ADMINISTRATIVO') return c.isAdministrativo;
            return false;
        });
    }, [topLevelNodes, activeTab]);

    // For Admin tab: get all admin collaborators for grouping by Atuação
    const adminColabs = useMemo(() => {
        if (activeTab !== 'ADMINISTRATIVO') return [];
        return data.filter(c => c.isAdministrativo && !c.isSocio);
    }, [data, activeTab]);

    const nodeContext = useMemo(() => ({
        activeTab,
        searchQuery,
        setSelectedColabForModal,
        setEditingPosition,
        setEditingCompetenciasId,
        setEditingCompetenciasText,
        subordinatesMap
    }), [activeTab, searchQuery, subordinatesMap]);

    if (colsLoading && data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
                    <p className="text-sm font-bold text-[#0a192f] uppercase tracking-widest animate-pulse">Carregando Estrutura...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`${isMaximized ? 'fixed inset-0 z-[100] bg-white w-full h-full p-6 space-y-6 overflow-auto' : 'p-8 w-full space-y-8'} animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen print:p-0 print:bg-white`}>

            {/* Header Section (Padrão Recrutamento) */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#0a192f] flex items-center justify-center shadow-lg">
                            <Network className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-[#0a192f] tracking-tight">Organograma</h1>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-13 flex items-center gap-2">
                        Estrutura Hierárquica do Salomão
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto justify-end mt-2 md:mt-0 custom-scrollbar">
                    {/* Tabs (Padrão Recrutamento) */}
                    <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
                        <button
                            onClick={() => setActiveTab('JURIDICO')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'JURIDICO' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Jurídico
                        </button>
                        <button
                            onClick={() => setActiveTab('ADMINISTRATIVO')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'ADMINISTRATIVO' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Administrativo
                        </button>
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-100 pl-4 ml-2">
                        {/* Search Ícone Expansível */}
                        <div className={`flex items-center bg-gray-50 border border-gray-200 rounded-xl transition-all relative overflow-hidden ${isSearchExpanded ? 'w-full md:w-64 px-4 py-2 focus-within:ring-2 focus-within:ring-[#1e3a8a]/20 focus-within:border-[#1e3a8a]' : 'w-10 h-10 justify-center cursor-pointer hover:bg-gray-100'}`}
                            onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}>
                            <Search className={`text-gray-400 shrink-0 ${isSearchExpanded ? 'h-4 w-4 mr-3' : 'h-5 w-5'}`} />
                            {isSearchExpanded && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Buscar nome ou área..."
                                        className="bg-transparent border-none text-sm w-full outline-none text-gray-700 font-medium placeholder:text-gray-400 pr-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                        onBlur={(e) => {
                                            if (!e.target.value) setIsSearchExpanded(false);
                                        }}
                                    />
                                    {(searchQuery || isSearchExpanded) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSearchQuery('');
                                                setIsSearchExpanded(false);
                                            }}
                                            className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                            title="Fechar busca"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Print Button */}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50 transition-all shadow-sm shrink-0"
                            title="Imprimir / PDF"
                        >
                            <Printer className="w-5 h-5" />
                        </button>


                    </div>
                </div>
            </div>

            {/* Sub-abas por Sócio (Jurídico) */}
            {activeTab === 'JURIDICO' && roots.length > 0 && (
                <div className="flex items-center gap-2 mt-2 mb-1 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                        onClick={() => setSelectedPartner('ALL')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 ${
                            selectedPartner === 'ALL'
                                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md shadow-blue-900/15'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a]'
                        }`}
                    >
                        Todos
                    </button>
                    {roots.map((root) => (
                        <button
                            key={root.id}
                            onClick={() => setSelectedPartner(root.id)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-2 shrink-0 ${
                                selectedPartner === root.id
                                    ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md shadow-blue-900/15'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a]'
                            }`}
                        >
                            {root.photo_url && (
                                <img src={root.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                            )}
                            {root.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Sub-abas por Atuação (Administrativo) */}
            {activeTab === 'ADMINISTRATIVO' && (() => {
                const atuacaoSet = new Set<string>();
                adminColabs.forEach(c => {
                    if (c.atuacao) atuacaoSet.add(c.atuacao);
                });
                const atuacaoList = Array.from(atuacaoSet).sort((a, b) => a.localeCompare(b));
                if (atuacaoList.length === 0) return null;
                return (
                    <div className="flex items-center gap-2 mt-2 mb-1 overflow-x-auto pb-2 custom-scrollbar">
                        <button
                            onClick={() => setSelectedAtuacao('ALL')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 ${
                                selectedAtuacao === 'ALL'
                                    ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md shadow-blue-900/15'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a]'
                            }`}
                        >
                            Todos
                        </button>
                        {atuacaoList.map((atuacao) => (
                            <button
                                key={atuacao}
                                onClick={() => setSelectedAtuacao(atuacao)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 ${
                                    selectedAtuacao === atuacao
                                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-md shadow-blue-900/15'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a8a]/30 hover:text-[#1e3a8a]'
                                }`}
                            >
                                {atuacao}
                            </button>
                        ))}
                    </div>
                );
            })()}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-2">
                <div className="text-[11px] font-bold text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm inline-flex items-center gap-2 max-w-fit">
                    <AlertCircle className="w-4 h-4 text-[#1e3a8a]" />
                    Arraste um colaborador para alterar sua subordinação. Alterações são imediatas.
                </div>
            </div>

            {/* Main Drag Drop Context Area */}
            <div ref={containerRef} className={`bg-gray-50/50 rounded-3xl border border-gray-100 flex-1 min-h-[600px] overflow-auto w-full relative group/container transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-[150] bg-white shadow-2xl' : ''}`}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="p-8 md:p-16 text-center min-w-full inline-block align-top print:w-full">
                        <div
                            className="inline-flex flex-col items-center gap-16 pb-32 transition-transform duration-300"
                            style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'top center',
                                width: 'max-content',
                                minWidth: '100%'
                            }}
                        >
                            {activeTab === 'ADMINISTRATIVO' && roots.length > 0 ? (
                                <AdminOrganogramTree
                                    diretorFinanceiro={roots[0]}
                                    allAdminColabs={adminColabs}
                                    context={nodeContext}
                                    selectedAtuacao={selectedAtuacao}
                                />
                            ) : roots.length > 0 ? (
                                selectedPartner === 'ALL' ? (
                                    roots.map((root, index) => (
                                        <div key={root.id} className="relative flex flex-col items-center w-full">
                                            <OrganogramNode colab={root} context={nodeContext} visitedIds={new Set<string>()} />
                                            {index < roots.length - 1 && <div className="w-full max-w-4xl h-[2px] bg-gray-200 mt-20"></div>}
                                        </div>
                                    ))
                                ) : (
                                    (() => {
                                        const selectedRoot = roots.find(r => r.id === selectedPartner);
                                        if (!selectedRoot) return null;
                                        return (
                                            <div className="relative flex flex-col items-center w-full">
                                                <OrganogramNode colab={selectedRoot} context={nodeContext} visitedIds={new Set<string>()} />
                                            </div>
                                        );
                                    })()
                                )
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">
                                    Nenhuma estrutura principal encontrada.
                                </div>
                            )}
                        </div>

                        {/* Unassigned or Orphan Nodes Pool */}
                        <div className="mt-16 pt-8 border-t border-gray-200">
                            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-6">Colaboradores sem subordinação</h3>
                            <Droppable droppableId="unassigned" direction="horizontal" type="COLAB">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex flex-wrap gap-4 p-6 rounded-2xl border-2 border-dashed transition-all
                      ${snapshot.isDraggingOver ? 'border-[#1e3a8a] bg-blue-50/50' : 'border-gray-200 bg-white'}`}
                                    >
                                        {data.filter(c => {
                                            if (c.isSocio) return false;
                                            if (c.leader_id || roots.some(r => r.id === c.id)) return false;
                                            if (activeTab === 'JURIDICO' && !c.isJuridico) return false;
                                            if (activeTab === 'ADMINISTRATIVO' && !c.isAdministrativo) return false;
                                            return true;
                                        }).map((colab, index) => (
                                            <Draggable key={colab.id} draggableId={colab.id} index={index}>
                                                {(dragProvided, dragSnapshot) => (
                                                    <div
                                                        ref={dragProvided.innerRef}
                                                        {...dragProvided.draggableProps}
                                                        {...dragProvided.dragHandleProps}
                                                        className={`group relative flex flex-col items-center cursor-pointer w-[180px] p-2 transition-all
                                ${dragSnapshot.isDragging ? 'opacity-50 scale-105' : ''}
                                ${!(!searchQuery || colab.name.toLowerCase().includes(searchQuery.toLowerCase()) || String(colab.role).toLowerCase().includes(searchQuery.toLowerCase()) || String(colab.equipe).toLowerCase().includes(searchQuery.toLowerCase())) ? 'opacity-30 grayscale' : ''}`}
                                                        onClick={() => setSelectedColabForModal(colab.fullData)}
                                                        title="Clique para expandir perfil"
                                                    >
                                                        <div className="w-20 h-20 rounded-full bg-white shadow-sm border-[3px] border-[#1e3a8a]/10 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:shadow-lg group-hover:scale-110 group-hover:border-[#1e3a8a]/30">
                                                            {colab.photo_url || colab.foto_url ? (
                                                                <img src={colab.photo_url || colab.foto_url} alt={colab.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#1e3a8a]/40">
                                                                    <UserIcon className="w-8 h-8" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 text-center w-full px-1 flex flex-col items-center gap-1.5">
                                                            <div className="w-full">
                                                                <h4 className="text-[13px] leading-tight font-black text-[#0a192f] tracking-tight truncate w-full">{colab.name}</h4>
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a8a] block mt-1 truncate w-full">{String(colab.role)}</span>
                                                            </div>
                                                            {colab.equipe && colab.equipe !== 'Sem Equipe' && (
                                                                <span className="inline-block px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full text-[8px] font-black uppercase tracking-wider text-gray-500 shadow-sm truncate w-full">
                                                                    {String(colab.equipe)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {data.filter(c => {
                                            if (c.isSocio) return false;
                                            if (c.leader_id || roots.some(r => r.id === c.id)) return false;
                                            if (activeTab === 'JURIDICO' && !c.isJuridico) return false;
                                            if (activeTab === 'ADMINISTRATIVO' && !c.isAdministrativo) return false;
                                            return true;
                                        }).length === 0 && (
                                                <div className="w-full text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-8">
                                                    Todos estão alocados.
                                                </div>
                                            )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    </div>
                </DragDropContext>
            </div>

            {/* Collaborator Detail Modal */}
            {
                selectedColabForModal && (
                    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="relative h-32 bg-gradient-to-r from-[#1e3a8a] to-[#0a192f]">
                                <button
                                    onClick={() => setSelectedColabForModal(null)}
                                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="px-8 pb-8 relative -mt-16">
                                <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6">
                                    <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {selectedColabForModal.photo_url || selectedColabForModal.foto_url ? (
                                            <img src={selectedColabForModal.photo_url || selectedColabForModal.foto_url} alt={selectedColabForModal.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-16 h-16 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="pt-2 sm:pt-16 text-center sm:text-left flex-1 min-w-0">
                                        <h2 className="text-2xl font-black text-[#0a192f] tracking-tight truncate">{selectedColabForModal.name}</h2>
                                        <p className="text-sm font-bold text-[#1e3a8a] uppercase tracking-wider mt-1 truncate">
                                            {typeof selectedColabForModal.roles === 'object' ? selectedColabForModal.roles?.name : selectedColabForModal.role}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                    <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipe / Área</p>
                                            <p className="text-sm font-bold text-[#0a192f] truncate">
                                                {typeof selectedColabForModal.teams === 'object' ? selectedColabForModal.teams?.name : selectedColabForModal.equipe || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Localidade</p>
                                            <p className="text-sm font-bold text-[#0a192f] truncate">
                                                {typeof selectedColabForModal.locations === 'object' ? selectedColabForModal.locations?.name : selectedColabForModal.local || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                                            <p className="text-sm font-bold text-[#0a192f] truncate">
                                                {selectedColabForModal.email || 'Não informado'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Celular</p>
                                            <p className="text-sm font-bold text-[#0a192f] truncate">
                                                {selectedColabForModal.phone || 'Não informado'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {selectedColabForModal.competencias && (
                                    <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag className="w-4 h-4 text-[#1e3a8a]" />
                                            <h3 className="text-xs font-black text-[#0a192f] uppercase tracking-widest">Competências no Organograma</h3>
                                        </div>
                                        <p className="text-sm text-[#0a192f] whitespace-pre-wrap leading-relaxed">
                                            {selectedColabForModal.competencias}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        Para edição completa, acesse a aba Colaboradores.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* Floating Competências Editor Overlay */}
            {editingCompetenciasId && editingPosition && (
                <div
                    className="fixed z-[200] w-[320px] animate-in zoom-in-95 duration-200"
                    style={{
                        top: Math.min(window.innerHeight - 200, editingPosition.top - 50),
                        left: Math.min(window.innerWidth - 340, editingPosition.left)
                    }}
                >
                    <div className="bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 flex flex-col gap-3 relative filter drop-shadow-xl">
                        <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest flex justify-between items-center">
                            Competências no Organograma
                            {savingCompetenciasId === editingCompetenciasId && <Loader2 className="w-3 h-3 animate-spin text-[#1e3a8a]" />}
                        </label>
                        <textarea
                            value={editingCompetenciasText}
                            onChange={(e) => {
                                setEditingCompetenciasText(e.target.value);
                                updateCompetencias(editingCompetenciasId, e.target.value);
                            }}
                            onBlur={() => {
                                saveCompetencias(editingCompetenciasId, editingCompetenciasText);
                                setEditingCompetenciasId(null);
                            }}
                            placeholder="Descreva as competências deste colaborador..."
                            className="w-full text-xs p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none transition-all resize-none min-h-[120px] text-[#0a192f] leading-relaxed"
                            autoFocus
                        />
                        <p className="text-[9px] text-gray-400 font-bold uppercase text-center">Clique fora para salvar</p>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Drag & Drop */}
            {pendingDragResult && (
                <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1e3a8a] mx-auto mb-6">
                                <ArrowUp className="w-8 h-8 rotate-90" />
                            </div>
                            <h3 className="text-xl font-black text-[#0a192f] tracking-tight mb-2">Alterar Hierarquia?</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                Você está prestes a alterar o líder direto de <strong className="text-[#1e3a8a]">{data.find(c => c.id === pendingDragResult.draggableId)?.name}</strong>. Esta mudança será refletida automaticamente no cadastro oficial do colaborador.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPendingDragResult(null)}
                                    className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDragConfirm}
                                    className="flex-1 px-6 py-3 rounded-xl bg-[#1e3a8a] text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#0a192f] transition-all shadow-lg shadow-blue-900/20"
                                >
                                    Prosseguir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hovering Zoom Controls & Navigation Panel */}
            <div className="fixed bottom-8 right-8 z-[200] flex items-center gap-3">
                {showBackToTop && (
                    <button
                        onClick={() => {
                            if (containerRef.current) {
                                containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-3 bg-white border border-blue-100 rounded-2xl shadow-xl text-[#1e3a8a] hover:bg-blue-50 transition-all animate-in slide-in-from-bottom-4"
                        title="Voltar ao Topo"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                )}

                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/10 border border-blue-100 flex items-center gap-2 animate-in slide-in-from-right-4">
                    <button
                        onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.1))}
                        className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-gray-500 hover:text-[#1e3a8a]"
                        title="Reduzir Zoom"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-[11px] font-black text-[#0a192f] min-w-[3rem] text-center w-12">
                        {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                        onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                        className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-gray-500 hover:text-[#1e3a8a]"
                        title="Aumentar Zoom"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button
                        onClick={() => setZoomLevel(1)}
                        className="p-2 hover:bg-blue-50 rounded-xl transition-colors text-gray-500 hover:text-[#1e3a8a]"
                        title="Restaurar tamanho (100%)"
                    >
                        <Network className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className={`p-2 rounded-xl transition-all ${isMaximized ? 'bg-blue-50 text-[#1e3a8a]' : 'hover:bg-blue-50 text-gray-500 hover:text-[#1e3a8a]'}`}
                        title={isMaximized ? "Minimizar" : "Maximizar"}
                    >
                        {isMaximized ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                description={alertConfig.description}
                variant={alertConfig.variant}
                confirmText="OK"
            />
        </div>
    );
}
