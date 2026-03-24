import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useColaboradores } from '../hooks/useColaboradores';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Network, Search, AlertCircle, Loader2, User as UserIcon, ZoomIn, ZoomOut, Maximize, Minimize, Printer, X, Briefcase, Mail, Phone, Tag, Building2, ArrowUp, Download, CheckSquare, Square } from 'lucide-react';
import { AlertModal } from '../../../components/ui/AlertModal';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    local: string;
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
        selectedAtuacao: string | string[] | 'ALL',
        hasAdministrativeSubordinates: (id: string, visited?: Set<string>) => boolean,
    },
    visitedIds: Set<string>,
    level?: number,
    isDense?: boolean,
    isSuperDense?: boolean
}) => {
    const { activeTab, searchQuery, setSelectedColabForModal, setEditingPosition, setEditingCompetenciasId, setEditingCompetenciasText, subordinatesMap, selectedAtuacao, hasAdministrativeSubordinates } = context;
    const subordinates = subordinatesMap.get(colab.id) || [];
    const roleStr = colab.role;

    if (visitedIds.has(colab.id)) return null;
    const nextVisited = new Set<string>(visitedIds).add(colab.id);

    // Visibility logic
    if (activeTab === 'JURIDICO' && !colab.isJuridico) return null;
    if (activeTab === 'ADMINISTRATIVO' && !colab.isAdministrativo && !hasAdministrativeSubordinates(colab.id)) return null;

    const matchesSearch = !searchQuery ||
        colab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        colab.equipe.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAtuacao = activeTab === 'ADMINISTRATIVO'
        ? (selectedAtuacao === 'ALL' || colab.atuacao === selectedAtuacao || level === 0)
        : true;

    const isMatch = matchesSearch && matchesAtuacao;

    const getRank = (rStr: string) => {
        const r = rStr.trim();
        const index = JURIDICO_HIERARCHY.findIndex(h => h.toLowerCase() === r.toLowerCase());
        return index === -1 ? 999 : index;
    };

    const sortedSubordinates = [...subordinates]
        .filter(c => {
            if (c.isSocio) return false; // Sócios are always roots, never subordinates visualised under another leader in the tree flow.
            if (activeTab === 'JURIDICO') return c.isJuridico;
            if (activeTab === 'ADMINISTRATIVO') return (c.isAdministrativo || hasAdministrativeSubordinates(c.id));
            return true;
        })
        .sort((a, b) => getRank(a.role) - getRank(b.role));

    // Removed roleGroups logic to show all subordinates horizontally.

    if (colab.isSocio && context.activeTab === 'ADMINISTRATIVO') {
        const filteredSubs = sortedSubordinates.filter(sub => {
            if (context.selectedAtuacao === 'ALL') return true;
            return sub.atuacao === context.selectedAtuacao;
        });

        const atuacaoGroups = new Map<string, ColaboradorCard[]>();
        filteredSubs.forEach(sub => {
            const key = sub.atuacao || 'Sem Atuação';
            if (!atuacaoGroups.has(key)) atuacaoGroups.set(key, []);
            atuacaoGroups.get(key)!.push(sub);
        });
        const atuacaoEntries = Array.from(atuacaoGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        return (
            <div className={`flex flex-col items-center w-full gap-y-24 transition-opacity duration-300 ${!isMatch ? 'opacity-30 grayscale print:opacity-100 print:grayscale-0' : ''}`}>
                {atuacaoEntries.map(([atuacaoName, atuacaoColabs]) => {
                    const localGroups = new Map<string, ColaboradorCard[]>();
                    atuacaoColabs.forEach(sub => {
                        const key = sub.local || 'Sem Local';
                        if (!localGroups.has(key)) localGroups.set(key, []);
                        localGroups.get(key)!.push(sub);
                    });
                    const localEntries = Array.from(localGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                    const uniqueDroppableId = `root:${colab.id}:${atuacaoName}`;
                    
                    return (
                        <div key={atuacaoName} className="flex flex-col items-center w-full relative">
                            {/* Socio Card Repeated */}
                            <div className="z-20">
                                <Droppable droppableId={uniqueDroppableId} type="COLAB">
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className={`relative flex flex-col items-center transition-all duration-300 ${isSuperDense ? 'w-[120px]' : isDense ? 'w-[140px]' : 'w-[160px]'}`}>
                                            <div className={`absolute inset-0 -m-4 rounded-3xl transition-colors z-[-1] ${snapshot.isDraggingOver ? 'bg-[#1e3a8a]/5 border-2 border-dashed border-[#1e3a8a]/30' : 'bg-transparent'}`} />
                                            
                                            <Draggable draggableId={`${colab.id}-${atuacaoName}`} index={0} isDragDisabled={true}>
                                                {(dragProvided) => (
                                                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} className="flex flex-col items-center w-full cursor-pointer" onClick={() => context.setSelectedColabForModal(colab.fullData)}>
                                                        <div className={`${isSuperDense ? 'w-16 h-16' : isDense ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-white shadow-md border-[3px] border-[#1e3a8a]/10 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-[#1e3a8a]/30`}>
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
                                                                <h4 className={`${isSuperDense ? 'text-[11px]' : isDense ? 'text-[12px]' : 'text-[13px]'} leading-tight font-black text-[#0a192f] tracking-tight text-center`}>{colab.name}</h4>
                                                                <span className={`${isSuperDense ? 'text-[8px]' : 'text-[9px]'} font-bold uppercase tracking-widest text-[#1e3a8a] block mt-1 text-center`}>{roleStr}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>

                            {/* Stem linking Socio to Atuação Label */}
                            <div className="w-[2px] h-8 bg-gray-300 mt-2"></div>
                            
                            {/* Atuação Label */}
                            <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-[#1e3a8a] px-8 py-3 rounded-[1.25rem] shadow-sm mb-6 flex items-center gap-2 relative z-10 w-max">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a]"></div>
                                <span className="text-[13px] font-black uppercase tracking-[0.2em]">{atuacaoName}</span>
                            </div>

                            {localEntries.length > 0 && (
                                <div className="flex justify-center relative pt-8 w-full gap-x-8">
                                    <div className="absolute top-[-1.5rem] left-1/2 w-[2px] h-8 bg-gray-300 -translate-x-1/2"></div>
                                    
                                    {localEntries.map(([localName, localColabs], locIdx) => (
                                        <div key={localName} className={`relative flex flex-col items-center ${localEntries.length > 5 ? 'px-1' : 'px-6'}`}>
                                            {localEntries.length > 1 && (
                                                <div className="absolute h-[2px] bg-gray-300" style={{
                                                    top: '-2rem',
                                                    left: locIdx === 0 ? '50%' : '0',
                                                    right: locIdx === localEntries.length - 1 ? '50%' : '0'
                                                }}></div>
                                            )}
                                            <div className="absolute top-0 left-1/2 w-[2px] h-8 bg-gray-300 -mt-8 -translate-x-1/2"></div>
                                            
                                            <div className="bg-gradient-to-r from-[#0a192f] to-[#1e3a8a] text-white px-5 py-2 rounded-xl shadow-md mb-2 relative z-10 w-max">
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{localName}</span>
                                            </div>
                
                                            <div className="w-[2px] h-6 bg-gray-300"></div>
                
                                            <div className="flex justify-center relative pt-4">
                                                {localColabs.map((sub, idx) => (
                                                    <div key={sub.id} className={`relative flex flex-col items-center ${localColabs.length > 8 ? 'px-0' : localColabs.length > 5 ? 'px-0.5' : 'px-3'}`}>
                                                        {localColabs.length > 1 && (
                                                            <div className="absolute h-[2px] bg-gray-300" style={{
                                                                top: '-1rem',
                                                                left: idx === 0 ? '50%' : '0',
                                                                right: idx === localColabs.length - 1 ? '50%' : '0'
                                                            }}></div>
                                                        )}
                                                        <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>
                                                        <div style={{
                                                            transform: localColabs.length > 12 ? 'scale(0.8)' : localColabs.length > 8 ? 'scale(0.85)' : localColabs.length > 5 ? 'scale(0.95)' : 'scale(1)',
                                                            transformOrigin: 'top center'
                                                        }}>
                                                            <OrganogramNode
                                                                colab={sub}
                                                                context={context}
                                                                visitedIds={nextVisited}
                                                                level={level + 1}
                                                                isDense={localColabs.length > 5 && localColabs.length <= 8}
                                                                isSuperDense={localColabs.length > 8}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center transition-opacity duration-300 ${!isMatch ? 'opacity-30 grayscale print:opacity-100 print:grayscale-0' : ''}`}>
            <Droppable droppableId={colab.id} type="COLAB">
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`relative flex flex-col items-center transition-all duration-300 ${isSuperDense ? 'w-[120px]' : isDense ? 'w-[140px]' : 'w-[160px]'} z-10 group hover:z-50 ${snapshot.isDraggingOver ? 'scale-105' : ''}`}
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
                                            <h4 className={`${isSuperDense ? 'text-[11px]' : isDense ? 'text-[12px]' : 'text-[13px]'} leading-tight font-black text-[#0a192f] tracking-tight text-center`}>{colab.name}</h4>
                                            <span className={`${isSuperDense ? 'text-[8px]' : 'text-[9px]'} font-bold uppercase tracking-widest text-[#1e3a8a] block mt-1 text-center`}>{roleStr}</span>
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
                        {colab.isSocio && activeTab === 'JURIDICO' ? (() => {
                            // Sócio: group subordinates by Local
                            const localGroups = new Map<string, ColaboradorCard[]>();
                            sortedSubordinates.forEach(sub => {
                                const key = sub.local || 'Sem Local';
                                if (!localGroups.has(key)) localGroups.set(key, []);
                                localGroups.get(key)!.push(sub);
                            });
                            const localEntries = Array.from(localGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                            return (
                                <div className="flex justify-center relative pt-4 w-full">
                                    {localEntries.map(([localName, localColabs], locIdx) => (
                                        <div key={localName} className={`relative flex flex-col items-center ${localEntries.length > 5 ? 'px-1' : 'px-6'}`}>
                                            {/* Per-local horizontal segment */}
                                            {localEntries.length > 1 && (
                                                <div className="absolute h-[2px] bg-gray-300" style={{
                                                    top: '-1rem',
                                                    left: locIdx === 0 ? '50%' : '0',
                                                    right: locIdx === localEntries.length - 1 ? '50%' : '0'
                                                }}></div>
                                            )}
                                            {/* Vertical stub up */}
                                            <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>

                                            {/* Local Label */}
                                            <div className="bg-gradient-to-r from-[#0a192f] to-[#1e3a8a] text-white px-5 py-2 rounded-xl shadow-md mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{localName}</span>
                                            </div>

                                            {/* Vertical line from Local label to collaborators */}
                                            <div className="w-[2px] h-6 bg-gray-300"></div>

                                            {/* Collaborators under this Local */}
                                            <div className="flex justify-center relative pt-4">
                                                {localColabs.map((sub, idx) => (
                                                    <div key={sub.id} className={`relative flex flex-col items-center ${localColabs.length > 8 ? 'px-0' : localColabs.length > 5 ? 'px-0.5' : 'px-3'}`}>
                                                        {/* Per-child horizontal segment */}
                                                        {localColabs.length > 1 && (
                                                            <div className="absolute h-[2px] bg-gray-300" style={{
                                                                top: '-1rem',
                                                                left: idx === 0 ? '50%' : '0',
                                                                right: idx === localColabs.length - 1 ? '50%' : '0'
                                                            }}></div>
                                                        )}
                                                        {/* Vertical stub up */}
                                                        <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>
                                                        <div style={{
                                                            transform: localColabs.length > 12 ? 'scale(0.8)' : localColabs.length > 8 ? 'scale(0.85)' : localColabs.length > 5 ? 'scale(0.95)' : 'scale(1)',
                                                            transformOrigin: 'top center'
                                                        }}>
                                                            <OrganogramNode
                                                                colab={sub}
                                                                context={context}
                                                                visitedIds={nextVisited}
                                                                level={level + 1}
                                                                isDense={localColabs.length > 5 && localColabs.length <= 8}
                                                                isSuperDense={localColabs.length > 8}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })() : (
                            // Sub-levels: All fallbacks (horizontal list)
                            <div className="flex flex-col items-center w-full relative pb-16">
                                <div className="flex justify-center relative pt-4 w-full">
                                    {sortedSubordinates.map((sub, idx) => (
                                        <div key={sub.id} className={`relative flex flex-col items-center ${sortedSubordinates.length > 8 ? 'px-0' : sortedSubordinates.length > 5 ? 'px-0.5' : 'px-4'}`}>
                                            {sortedSubordinates.length > 1 && (
                                                <div className="absolute h-[2px] bg-gray-300" style={{
                                                    top: '-1rem',
                                                    left: idx === 0 ? '50%' : '0',
                                                    right: idx === sortedSubordinates.length - 1 ? '50%' : '0'
                                                }}></div>
                                            )}
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
                            </div>
                        )}
                    </div>
                </div>
            )}
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
    const [selectedPartner, setSelectedPartner] = useState<string | string[] | 'ALL'>('ALL');
    const [selectedAtuacao, setSelectedAtuacao] = useState<string | string[] | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [editingCompetenciasId, setEditingCompetenciasId] = useState<string | null>(null);
    const [editingCompetenciasText, setEditingCompetenciasText] = useState('');
    const [editingPosition, setEditingPosition] = useState<{ top: number, left: number } | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const treeWrapperRef = useRef<HTMLDivElement>(null);

    // Export PDF Modal State
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [exportScope, setExportScope] = useState<string[]>([]);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Pan (Infinite Canvas) Logic — direct DOM translation (bypasses all scrollbar limits)
    const panRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const container = containerRef.current;
        const wrapper = treeWrapperRef.current;
        if (!container || !wrapper) return;

        let isDown = false;
        let lastX = 0;
        let lastY = 0;

        const applyPan = () => {
            if (wrapper) {
                wrapper.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomLevel})`;
            }
        };

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Allow panning only when clicking on the background (not nodes, buttons, inputs)
            if (target.closest('button') || target.closest('[data-rbd-draggable-id]') || target.closest('input')) {
                return;
            }

            e.preventDefault();
            isDown = true;
            lastX = e.clientX;
            lastY = e.clientY;
            document.body.style.userSelect = 'none';
            container.style.cursor = 'grabbing';
            wrapper.style.transition = 'none'; // Instant follow
            container.focus();
        };

        const onMouseUp = () => {
            if (!isDown) return;
            isDown = false;
            document.body.style.userSelect = '';
            container.style.cursor = 'grab';
            wrapper.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'; // Restore smooth zoom
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();

            panRef.current.x += (e.clientX - lastX);
            panRef.current.y += (e.clientY - lastY);
            lastX = e.clientX;
            lastY = e.clientY;

            applyPan();
        };

        const onWheel = (e: WheelEvent) => {
            // Support trackpads and mouse wheel for panning since overflow is hidden
            e.preventDefault();
            panRef.current.x -= e.deltaX;
            panRef.current.y -= e.deltaY;
            applyPan();
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (!container.contains(document.activeElement) && document.activeElement !== container) return;
            
            const step = 40;
            let moved = false;
            if (e.key === 'ArrowUp') { panRef.current.y += step; moved = true; }
            if (e.key === 'ArrowDown') { panRef.current.y -= step; moved = true; }
            if (e.key === 'ArrowLeft') { panRef.current.x += step; moved = true; }
            if (e.key === 'ArrowRight') { panRef.current.x -= step; moved = true; }
            
            if (moved) {
                e.preventDefault();
                wrapper.style.transition = 'transform 0.1s ease-out';
                applyPan();
                setTimeout(() => { if (wrapper) wrapper.style.transition = 'none'; }, 100);
            }
        };

        container.addEventListener('mousedown', onMouseDown, { capture: true });
        container.addEventListener('wheel', onWheel, { passive: false });
        container.addEventListener('keydown', onKeyDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove, { passive: false });

        // On mount or zoom change, ensure transform is applied
        applyPan();

        return () => {
            container.removeEventListener('mousedown', onMouseDown, { capture: true });
            container.removeEventListener('wheel', onWheel);
            container.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
        };
    }, [zoomLevel]); // Re-bind when zoom changes so applyPan has latest zoomLevel

    // Auto-center pan when changing tabs/filters
    useLayoutEffect(() => {
        panRef.current = { x: 0, y: 0 };
        if (treeWrapperRef.current) {
            treeWrapperRef.current.style.transform = `translate(0px, 0px) scale(${zoomLevel})`;
        }
    }, [activeTab, selectedPartner, selectedAtuacao]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsPdfModalOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
                    const isSocio = roleLower.includes('sócio') || roleLower.includes('socio') || roleLower.includes('diretor financeiro');
                    
                    const atuacaoId = String((c as any).atuacao || '');
                    const atuacaoName = atuacoesMap.get(atuacaoId) || atuacaoId || '';
                    const equipeName = (typeof c.teams === 'object' ? (c.teams as any)?.name : c.equipe) || 'Geral';
                    
                    const equipeLower = String(equipeName).toLowerCase();
                    const atuacaoLower = String(atuacaoName).toLowerCase();

                    // roles that unconditionally belong to the Jurídico organization no matter the team's label
                    const roleIsStrictlyLegal = isSocio || roleLower.includes('advogado') || roleLower.includes('estagiário') || roleLower.includes('estagiario') || roleLower.includes('sócio');

                    const explicitlyAdminEquipes = ['rh', 'recurso', 'financeiro', 'adm', 'administra', 'ti ', 'tecnologia', 'marketing', 'comunica', 'inova', 'facilities', 'recep', 'controladoria'];
                    const explicitlyAdmin = !roleIsStrictlyLegal && explicitlyAdminEquipes.some(term => equipeLower.includes(term) || atuacaoLower.includes(term));

                    const isLegalTeam = ['cível', 'civel', 'tributário', 'tributario', 'trabalhista', 'societário', 'societario', 'contencioso', 'estratégico', 'estrategico', 'empresarial', 'penal', 'público', 'publico'].some(term => equipeLower.includes(term) || atuacaoLower.includes(term));

                    let isJuridico = JURIDICO_HIERARCHY.some(h => roleLower.includes(h.toLowerCase())) ||
                        isSocio ||
                        roleLower.includes('advogado') ||
                        roleLower.includes('estagiário') ||
                        roleLower.includes('estagiario') ||
                        roleLower.includes('jurídico') ||
                        roleLower.includes('juridico');

                    // Rescue legal team members and coordinators who were missing from string matches
                    if (!isJuridico && !explicitlyAdmin && (isLegalTeam || roleLower.includes('coordenador') || roleLower.includes('paralegal') || roleLower.includes('consultor') || roleLower.includes('assistente'))) {
                        isJuridico = true;
                    }

                    // Explicit override
                    if (c.name === 'Felipe Dornelas Aniceto') {
                        isJuridico = false;
                    }

                    return {
                        id: c.id,
                        name: c.name,
                        role: roleStr || 'Sem Cargo',
                        equipe: equipeName,
                        atuacao: atuacaoName,
                        local: (typeof c.locations === 'object' ? (c.locations as any)?.name : c.local) || 'Sem Local',
                        leader_id: c.leader_id || undefined,
                        competencias: c.competencias || '',
                        photo_url: c.photo_url || c.foto_url,
                        foto_url: c.foto_url,
                        isJuridico: isJuridico && !explicitlyAdmin,
                        isAdministrativo: !isJuridico || explicitlyAdmin,
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
    const rawSubordinatesMap = useMemo(() => {
        const map = new Map<string | null, ColaboradorCard[]>();
        data.forEach(c => {
            const lid = c.leader_id || null;
            if (!map.has(lid)) map.set(lid, []);
            map.get(lid)!.push(c);
        });
        return map;
    }, [data]);

    // Helper to check if a node or any of its descendants have administrative subordinates
    // Also respects the `selectedAtuacao` filter if active.
    const hasAdministrativeSubordinates = useCallback((leaderId: string, visited = new Set<string>()): boolean => {
        if (visited.has(leaderId)) return false; // Cycle protection
        visited.add(leaderId);

        const subs = rawSubordinatesMap.get(leaderId) || [];
        for (const sub of subs) {
            if (sub.isSocio) continue;

             const isTrulyAdmin = sub.isAdministrativo && (sub.atuacao.trim().length > 0 || (sub.role.trim().length > 0 && sub.role !== 'Sem Cargo'));
             
             // Check Atuacao filter match
             const matchesAtuacao = activeTab === 'ADMINISTRATIVO' && selectedAtuacao !== 'ALL' 
                                    ? (Array.isArray(selectedAtuacao) ? selectedAtuacao.includes(sub.atuacao) : sub.atuacao === selectedAtuacao)
                                    : true;

            if (isTrulyAdmin && matchesAtuacao) return true;
            if (hasAdministrativeSubordinates(sub.id, visited)) return true;
        }
        return false;
    }, [rawSubordinatesMap, activeTab, selectedAtuacao]);

    // Create the final subordinates map used by the render tree.
    // If in Admin tab with an Atuação selected, we only keep subordinates that EITHER match the Atuação OR have descendants that match it.
    const subordinatesMap = useMemo(() => {
        if (activeTab !== 'ADMINISTRATIVO' || selectedAtuacao === 'ALL') {
            return rawSubordinatesMap;
        }

        const filteredMap = new Map<string | null, ColaboradorCard[]>();
        
        // Helper to check if a specific node should be kept
        const shouldKeepNode = (colab: ColaboradorCard): boolean => {
            if (colab.isSocio) return true; // Keep partners
            if (Array.isArray(selectedAtuacao)) {
                if (colab.atuacao && selectedAtuacao.includes(colab.atuacao)) return true;
            } else {
                if (colab.atuacao === selectedAtuacao) return true; // Direct match
            }
            // Check if any descendants match
            return hasAdministrativeSubordinates(colab.id);
        };

        rawSubordinatesMap.forEach((subs, leaderId) => {
            const keptSubs = subs.filter(shouldKeepNode);
            if (keptSubs.length > 0) {
                filteredMap.set(leaderId, keptSubs);
            }
        });

        return filteredMap;
    }, [rawSubordinatesMap, activeTab, selectedAtuacao, hasAdministrativeSubordinates]);

    // Get Top Level Nodes (Partners or those explicitly set as top)
    const topLevelNodes = useMemo(() => {
        return data.filter(c => {
            // Use the globally constructed isSocio mapping, which already considers Diretor Financeiro (Felipe)
            if (c.isSocio) return true;
            
            // Otherwise, they're top level if they have no leader
            return !c.leader_id;
        });
    }, [data]);
    // Find pure top level nodes based on active tab
    // NOTE: These hooks MUST be before any early returns to comply with React Rules of Hooks
    const roots = useMemo(() => {
        return topLevelNodes.filter(c => {
            if (activeTab === 'JURIDICO') return c.isJuridico;
            if (activeTab === 'ADMINISTRATIVO') {
                // Felipe (Diretor Financeiro) and Gabriel are explicitly the primary Sócios for Administrativo
                if (c.id === 'COL - 0002' || c.name.toLowerCase().includes('felipe dornelas') || c.id === 'COL - 0161' || c.name.toLowerCase().includes('gabriel parreiras horta')) return true;
                
                // Allow Jurídico partners to appear ONLY if they verifiably hold administrative subordinates down their specific chain
                return c.isSocio && hasAdministrativeSubordinates(c.id);
            }
            return false;
        });
    }, [topLevelNodes, activeTab, hasAdministrativeSubordinates]);

    const adminColabs = useMemo(() => {
        if (activeTab !== 'ADMINISTRATIVO') return [];
        return data.filter(c => c.isAdministrativo && !c.isSocio);
    }, [data, activeTab]);

    useLayoutEffect(() => {
        if (selectedPartner === 'ALL' || selectedAtuacao === 'ALL') {
            const timer = setTimeout(() => {
                const container = containerRef.current;
                if (container) {
                    // Force scroll to the extreme left so the first item (e.g. Alice) is fully visible
                    container.scrollLeft = 0;
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedPartner, selectedAtuacao, data.length, activeTab]);

    useEffect(() => {
        if (isPdfModalOpen) {
            if (activeTab === 'JURIDICO') {
                setExportScope(roots.map(r => r.id));
            } else {
                const atuacaoSet = new Set<string>();
                adminColabs.forEach(c => { if (c.atuacao) atuacaoSet.add(c.atuacao); });
                setExportScope(Array.from(atuacaoSet));
            }
        }
    }, [isPdfModalOpen, activeTab, roots, adminColabs]);

    const nodeContext = useMemo(() => ({
        activeTab,
        searchQuery,
        setSelectedColabForModal,
        setEditingPosition,
        setEditingCompetenciasId,
        setEditingCompetenciasText,
        subordinatesMap,
        selectedAtuacao,
        hasAdministrativeSubordinates
    }), [activeTab, searchQuery, subordinatesMap, selectedAtuacao, hasAdministrativeSubordinates]);

    const handleExportExcel = useCallback(() => {
        try {
            if (data.length === 0) {
                showAlert('Aviso', 'Não há dados para exportar.', 'info');
                return;
            }

            const excelData = data.map(c => {
                const leaderName = c.leader_id ? data.find(l => l.id === c.leader_id)?.name : 'Sem subordinação';
                
                return {
                    'Identificação': c.id,
                    'Nome': c.name,
                    'Cargo': c.role,
                    'Equipe / Área': c.equipe,
                    'Atuação': c.atuacao || '-',
                    'Localidade': c.local,
                    'Líder Direto': leaderName,
                    'Email': c.fullData?.email || 'Não informado',
                    'Celular': c.fullData?.phone || 'Não informado',
                    'Competências': c.competencias || ''
                };
            });

            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // Set basic column widths
            const colWidths = [
                { wch: 15 }, // Identificação
                { wch: 35 }, // Nome
                { wch: 25 }, // Cargo
                { wch: 25 }, // Equipe / Área
                { wch: 20 }, // Atuação
                { wch: 20 }, // Localidade
                { wch: 35 }, // Líder Direto
                { wch: 35 }, // Email
                { wch: 20 }, // Celular
                { wch: 60 }  // Competências
            ];
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Organograma');
            
            XLSX.writeFile(wb, 'Organograma_Estrutura.xlsx');
            showAlert('Sucesso', 'Estrutura exportada em Excel com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            showAlert('Erro', 'Ocorreu um erro ao tentar exportar a planilha.', 'error');
        }
    }, [data]);

    const handleExportPDF = async () => {
        try {
            if (data.length === 0) {
                showAlert('Aviso', 'Não há dados para exportar.', 'info');
                return;
            }
            if (exportScope.length === 0) {
                showAlert('Aviso', 'Selecione pelo menos um item para exportar.', 'info');
                return;
            }
            setIsExportingPDF(true);
            
            // Allow DOM to update logic 
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const prevPartner = selectedPartner;
            const prevAtuacao = selectedAtuacao;
            
            // Check if ALL options possible are selected
            let isAllSelected = false;
            if (activeTab === 'JURIDICO') {
                isAllSelected = exportScope.length === roots.length;
                setSelectedPartner(isAllSelected ? 'ALL' : exportScope);
            } else {
                const atuacaoSet = new Set<string>();
                adminColabs.forEach(c => { if (c.atuacao) atuacaoSet.add(c.atuacao); });
                isAllSelected = exportScope.length === atuacaoSet.size;
                setSelectedAtuacao(isAllSelected ? 'ALL' : exportScope);
            }
            
            // Wait for React to render the new tree layout
            await new Promise(resolve => setTimeout(resolve, 800));

            const element = treeWrapperRef.current;
            if (!element) {
                showAlert('Erro', 'Conteúdo da árvore não encontrado.', 'error');
                setIsExportingPDF(false);
                return;
            }
            
            // Append temporary "Executive UI Header" to the element for the snapshot
            const headerDiv = document.createElement('div');
            headerDiv.style.padding = '40px 40px 20px 40px';
            headerDiv.style.display = 'flex';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.borderBottom = '4px solid #1e3a8a';
            headerDiv.style.marginBottom = '20px';
            headerDiv.style.marginTop = '20px';
            headerDiv.style.background = 'white';
            
            const logoImg = document.createElement('img');
            logoImg.src = '/logo-salomao.png';
            logoImg.style.height = '64px';
            logoImg.style.objectFit = 'contain';
            
            const titleDiv = document.createElement('div');
            titleDiv.style.marginLeft = '24px';
            titleDiv.style.borderLeft = '2px solid #1e3a8a';
            titleDiv.style.paddingLeft = '24px';
            const titleH1 = document.createElement('h1');
            titleH1.innerText = 'Organograma - Salomão, Kaiuca & Abrahão';
            titleH1.style.color = '#0a192f';
            titleH1.style.margin = '0';
            titleH1.style.fontSize = '26px';
            titleH1.style.fontFamily = 'Arial, sans-serif';
            titleH1.style.fontWeight = 'bold';
            
            const subtitleP = document.createElement('p');
            const scopeLabel = isAllSelected ? 'Todos' : `${exportScope.length} itens selecionados`;
            subtitleP.innerText = `Estrutura: ${activeTab === 'JURIDICO' ? 'Jurídica' : 'Administrativa'} | Foco: ${scopeLabel}`;
            subtitleP.style.color = '#64748b';
            subtitleP.style.margin = '8px 0 0 0';
            subtitleP.style.fontSize = '16px';
            subtitleP.style.fontFamily = 'Arial, sans-serif';
            
            titleDiv.appendChild(titleH1);
            titleDiv.appendChild(subtitleP);
            headerDiv.appendChild(logoImg);
            headerDiv.appendChild(titleDiv);
            
            element.insertBefore(headerDiv, element.firstChild);
            
            const originalBackground = element.style.background;
            element.style.background = '#ffffff';
            
            // Temporary hide header logic controls
            const controlsNode = element.querySelector('.flex.flex-col.md\\:flex-row.items-start');
            let controlsDisplay = '';
            if (controlsNode && controlsNode instanceof HTMLElement) {
                controlsDisplay = controlsNode.style.display;
                controlsNode.style.display = 'none';
            }

            // Adicionar uma tag de estilo global para quebrar os limites do html2canvas 
            // - Remover truncamentos de texto para que não sejam cortados
            // - Remover limites de max-width
            // - Remover scales (transform) inline para renderizar as divs nos tamanhos 100% reais de alta qualidade
            // Neutralize inline transform explicitly to capture 100% native scale without clipping
            const originalTransform = element.style.transform;
            element.style.transform = 'none';

            // Calculate a safe scale to avoid canvas memory limits (max ~268M pixels in Chrome)
            const MAX_CANVAS_AREA = 160000000; // Safe threshold (~160M pixels)
            const elementArea = element.scrollWidth * element.scrollHeight;
            let safeScale = 3;
            
            if (elementArea * safeScale * safeScale > MAX_CANVAS_AREA) {
                safeScale = Math.max(1, Math.floor(Math.sqrt(MAX_CANVAS_AREA / elementArea) * 10) / 10);
            }

            const canvas = await html2canvas(element, {
                scale: safeScale, // Alta resolução dinâmica para fotos não ficarem pixeladas
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });
            
            // Restore UI
            element.style.transform = originalTransform;
            element.removeChild(headerDiv);
            element.style.background = originalBackground;
            if (controlsNode && controlsNode instanceof HTMLElement) {
                controlsNode.style.display = controlsDisplay;
            }
            
            if (activeTab === 'JURIDICO') {
                setSelectedPartner(prevPartner);
            } else {
                setSelectedAtuacao(prevAtuacao);
            }
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // Converter tamanho originário em MM para um PDF de tamanho exato (high-res display)
            const pdfWidth = (canvas.width * 25.4) / 300; // baseado em 300DPI
            const pdfHeight = (canvas.height * 25.4) / 300; 
            
            const pdf = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            let fileName = 'Organograma.pdf';
            if (isAllSelected) {
                fileName = `Organograma - Todos (${activeTab === 'JURIDICO' ? 'Jurídico' : 'Administrativo'}).pdf`;
            } else if (exportScope.length === 1) {
                if (activeTab === 'JURIDICO') {
                    const partner = roots.find(r => r.id === exportScope[0]);
                    fileName = `Organograma - ${partner?.name || 'Sócio'}.pdf`;
                } else {
                    fileName = `Organograma - ${exportScope[0]}.pdf`;
                }
            } else {
                fileName = `Organograma - Seleção Personalizada.pdf`;
            }
            
            pdf.save(fileName);
            
            showAlert('Sucesso', 'PDF Exportado com sucesso!', 'success');
            setIsPdfModalOpen(false);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showAlert('Erro', 'Ocorreu um erro ao gerar o PDF.', 'error');
        } finally {
            setIsExportingPDF(false);
        }
    };

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

                        {/* Export Excel Button */}
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center justify-center h-10 px-3 md:px-4 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-600 rounded-xl text-white hover:from-emerald-700 hover:to-emerald-600 hover:border-emerald-700 transition-all shadow-sm shadow-emerald-900/10 shrink-0 font-bold text-xs uppercase tracking-wider"
                            title="Planilha (Excel)"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden md:inline">Planilha</span>
                        </button>

                        {/* PDF Export Button */}
                        <button
                            onClick={() => setIsPdfModalOpen(true)}
                            className="flex items-center justify-center h-10 px-3 md:px-4 gap-2 bg-gradient-to-r from-red-600 to-red-500 border border-red-600 rounded-xl text-white hover:from-red-700 hover:to-red-600 hover:border-red-700 transition-all shadow-sm shadow-red-900/10 shrink-0 font-bold text-xs uppercase tracking-wider"
                            title="Exportar PDF"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden md:inline">PDF</span>
                        </button>

                        </div>
                    </div>
                </div>

                {/* Sub-abas por Sócio/Atuação (Condensadas no Topo sem rolagem) */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 px-4 w-full print:hidden">
                    {activeTab === 'JURIDICO' && roots.length > 0 && roots.map((root) => {
                        // Função para condensar e padronizar os nomes conforme solicitado
                        const getShortName = (name: string) => {
                            const lower = name.toLowerCase();
                            if (lower.includes('alice')) return 'Alice Studart';
                            if (lower.includes('bernardo kaiuca')) return 'Bernardo Kaiuca';
                            if (lower.includes('eduardo abrahão')) return 'Eduardo Abrahão';
                            if (lower.includes('lívia') && lower.includes('sancio')) return 'Lívia Sancio';
                            if (lower.includes('luis felipe') && lower.includes('salomão')) return 'Luis Salomão';
                            if (lower.includes('luiz felipe pavan')) return 'Luiz Pavan';
                            if (lower.includes('marcus lívio') || lower.includes('livio')) return 'Marcus Lívio';
                            if (lower.includes('paulo') && (lower.includes('salomão') || lower.includes('salomao') || lower.includes('souza') || lower.includes('filho'))) return 'Paulo Salomão';
                            if (lower.includes('pedro neiva')) return 'Pedro Neiva';
                            if (lower.includes('rodrigo de magalhães cotta')) return 'Rodrigo Cotta';
                            if (lower.includes('rodrigo raposo')) return 'Rodrigo Raposo';
                            if (lower.includes('rodrigo salomão')) return 'Rodrigo Salomão';
                            
                            // Fallback caso encontre algo não mapeado
                            const parts = name.split(' ');
                            return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name;
                        };

                        const shortName = getShortName(root.name);
                        const isActive = (selectedPartner === root.id) || (selectedPartner === 'ALL' && roots[0]?.id === root.id);

                        return (
                            <button
                                key={root.id}
                                onClick={() => setSelectedPartner(root.id)}
                                className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border shadow-sm flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-[#1e3a8a] to-[#0a192f] text-white border-transparent shadow-md shadow-blue-900/20 z-10 scale-105'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a8a]/40 hover:text-[#1e3a8a] hover:bg-blue-50/50 hover:shadow-md'
                                }`}
                                title={root.name}
                            >
                                {root.photo_url && (
                                    <img src={root.photo_url} alt="" className={`w-5 h-5 rounded-full object-cover shrink-0 ${isActive ? 'ring-2 ring-white/50' : ''}`} />
                                )}
                                <span className="whitespace-nowrap">{shortName}</span>
                            </button>
                        );
                    })}

                    {activeTab === 'ADMINISTRATIVO' && (() => {
                        const atuacaoSet = new Set<string>();
                        adminColabs.forEach(c => {
                            if (c.atuacao) atuacaoSet.add(c.atuacao);
                        });
                        const atuacaoList = Array.from(atuacaoSet)
                            .filter(a => a.toLowerCase() !== 'administrativo')
                            .sort((a, b) => a.localeCompare(b));
                        
                        if (atuacaoList.length === 0) return null;
                        
                        return atuacaoList.map((atuacao, idx) => {
                            const isActive = (selectedAtuacao === atuacao) || (selectedAtuacao === 'ALL' && idx === 0);
                            return (
                                <button
                                    key={atuacao}
                                    onClick={() => setSelectedAtuacao(atuacao)}
                                    className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border shadow-sm ${
                                        isActive
                                            ? 'bg-gradient-to-r from-[#1e3a8a] to-[#0a192f] text-white border-transparent shadow-md shadow-blue-900/20 z-10 scale-105'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a8a]/40 hover:text-[#1e3a8a] hover:bg-blue-50/50 hover:shadow-md'
                                    }`}
                                    title={atuacao}
                                >
                                    <span className="whitespace-nowrap">{atuacao}</span>
                                </button>
                            );
                        });
                    })()}
                </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-2">
                <div className="text-[11px] font-bold text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm inline-flex items-center gap-2 max-w-fit">
                    <AlertCircle className="w-4 h-4 text-[#1e3a8a]" />
                    Arraste um colaborador para alterar sua subordinação. Alterações são imediatas.
                </div>
            </div>

            {/* Main Drag Drop Context Area */}
            <div 
                ref={containerRef} 
                tabIndex={0}
                className={`bg-gray-50/50 rounded-3xl border border-gray-100 flex-1 min-h-[600px] overflow-hidden w-full relative group/container outline-none transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-[150] bg-white shadow-2xl' : ''} cursor-grab`}
            >
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="text-center min-w-full inline-block align-top print:w-full h-full">
                        <div
                            ref={treeWrapperRef}
                            className={`inline-flex flex-col gap-16 p-16 transition-transform duration-300 relative mx-auto ${selectedPartner === 'ALL' || selectedAtuacao === 'ALL' ? 'items-start' : 'items-center'}`}
                            style={{
                                transformOrigin: 'top center',
                                width: 'max-content',
                                minWidth: '100%'
                            }}
                        >
                            {roots.length > 0 ? (
                                (() => {
                                    if (activeTab === 'ADMINISTRATIVO') {
                                        return roots.map((root, index, arr) => (
                                            <div key={root.id} className="relative flex flex-col items-center w-full">
                                                <OrganogramNode colab={root} context={nodeContext} visitedIds={new Set<string>()} />
                                                {index < arr.length - 1 && <div className="w-full max-w-4xl h-[2px] bg-gray-200 mt-20 print:hidden"></div>}
                                            </div>
                                        ));
                                    }

                                    const activePartner = selectedPartner === 'ALL' ? roots[0]?.id : selectedPartner;
                                    const selectedRoot = roots.find(r => r.id === activePartner);
                                    if (!selectedRoot) return null;
                                    return (
                                        <div className="relative flex flex-col items-center w-full">
                                            <OrganogramNode colab={selectedRoot} context={nodeContext} visitedIds={new Set<string>()} />
                                        </div>
                                    );
                                })()
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

            {/* Modal de Exportação PDF */}
            {isPdfModalOpen && document.body && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsPdfModalOpen(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#1e3a8a] to-[#0a192f]">
                            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Printer className="w-5 h-5 text-white" />
                                Exportar Relatório PDF
                            </h2>
                            <button onClick={() => setIsPdfModalOpen(false)} className="text-white hover:text-blue-200 transition-colors p-1" title="Fechar (ESC)">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Selecione o Escopo ({activeTab})</label>
                                
                                {(() => {
                                    const availableOptions = activeTab === 'JURIDICO' 
                                        ? roots.map(r => ({ id: r.id, label: r.name, photo_url: r.photo_url || r.foto_url }))
                                        : (() => {
                                            const atuacaoSet = new Set<string>();
                                            adminColabs.forEach(c => { if (c.atuacao) atuacaoSet.add(c.atuacao); });
                                            return Array.from(atuacaoSet).sort((a, b) => a.localeCompare(b)).map(a => ({ id: a, label: a, photo_url: null }));
                                        })();
                                    
                                    const allSelected = exportScope.length === availableOptions.length && availableOptions.length > 0;
                                    
                                    const toggleAll = () => {
                                        if (allSelected) setExportScope([]);
                                        else setExportScope(availableOptions.map(o => o.id));
                                    };
                                    
                                    const toggleOption = (id: string) => {
                                        setExportScope(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                                    };

                                    return (
                                        <>
                                            <button
                                              onClick={toggleAll}
                                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition-colors group mb-4"
                                            >
                                              <div className={`p-0.5 rounded flex items-center justify-center shrink-0 transition-colors ${allSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                                                {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                              </div>
                                              <span className={`text-sm font-bold transition-colors ${allSelected ? 'text-blue-800' : 'text-gray-600'}`}>
                                                {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos da Aba'}
                                              </span>
                                            </button>

                                            <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                                              {availableOptions.map(opt => {
                                                  const isSelected = exportScope.includes(opt.id);
                                                  return (
                                                      <button
                                                        key={opt.id}
                                                        onClick={() => toggleOption(opt.id)}
                                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group text-left border border-transparent hover:border-gray-100"
                                                      >
                                                        <div className={`shrink-0 transition-colors ${isSelected ? 'text-[#1e3a8a]' : 'text-gray-300 group-hover:text-[#1e3a8a]/60'}`}>
                                                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                        </div>
                                                        {opt.photo_url && <img src={opt.photo_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />}
                                                        <span className={`text-sm font-medium leading-tight transition-colors ${isSelected ? 'text-[#0a192f]' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                                          {opt.label}
                                                        </span>
                                                      </button>
                                                  );
                                              })}
                                            </div>
                                        </>
                                    );
                                })()}

                                <p className="text-[10px] text-gray-400 mt-4 font-medium text-center bg-gray-50 p-3 rounded-xl border border-gray-100">O PDF será gerado em alta resolução preservando a escala original.</p>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex items-center gap-3">
                            <button
                                onClick={() => setIsPdfModalOpen(false)}
                                className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={isExportingPDF}
                                className="flex-1 px-4 py-3 text-sm font-bold text-white border border-[#1e3a8a] rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#0a192f] transition-all shadow-sm flex justify-center items-center gap-2 uppercase tracking-wider hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Printer className="w-4 h-4 text-white" />}
                                {isExportingPDF ? 'Gerando...' : 'Gerar PDF'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
