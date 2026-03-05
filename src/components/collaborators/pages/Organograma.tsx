import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useColaboradores } from '../hooks/useColaboradores';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Network, Search, AlertCircle, Save, Loader2, User as UserIcon, ZoomIn, ZoomOut, Maximize, Minimize, Printer, X, Briefcase, Mail, Phone, Tag, Building2 } from 'lucide-react';
import { toast } from 'sonner';

// Define the exact hierarchy order for Jurídico
const JURIDICO_HIERARCHY = [
    'Sócios',
    'Advogado Sênior III',
    'Advogado Sênior II',
    'Advogado Sênior I',
    'Advogado Pleno III',
    'Advogado Pleno II',
    'Advogado Pleno I',
    'Advogado Júnior III',
    'Advogado Júnior II',
    'Advogado Júnior I',
    'Estagiário'
];

interface ColaboradorCard {
    id: string;
    name: string;
    role: string | { name: string };
    equipe: string | { name: string };
    leader_id?: string;
    competencias?: string;
    photo_url?: string;
    foto_url?: string;
    fullData?: any;
}

export function Organograma() {
    const { colaboradores, loading: colsLoading, fetchColaboradores } = useColaboradores();
    const [data, setData] = useState<ColaboradorCard[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savingCompetenciasId, setSavingCompetenciasId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [selectedColabForModal, setSelectedColabForModal] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'JURIDICO' | 'ADMINISTRATIVO'>('JURIDICO');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMaximized, setIsMaximized] = useState(false);

    // Filter and sort collaborators based on Jurídico hierarchy initially
    // For now, we focus on Jurídico as requested, but all are loaded
    useEffect(() => {
        if (colaboradores.length > 0) {
            const mapped = colaboradores
                .filter(c => c.status === 'active')
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    role: typeof c.roles === 'object' ? c.roles?.name : c.role,
                    equipe: typeof c.teams === 'object' ? c.teams?.name : c.equipe,
                    leader_id: c.leader_id || undefined,
                    competencias: c.competencias || '',
                    photo_url: c.photo_url || c.foto_url,
                    foto_url: c.foto_url,
                    fullData: c
                }));
            setData(mapped as ColaboradorCard[]);
        }
    }, [colaboradores]);

    const updateCompetencias = async (id: string, text: string) => {
        const newData = data.map(c => c.id === id ? { ...c, competencias: text } : c);
        setData(newData);
    };

    const saveCompetencias = async (id: string, text: string) => {
        try {
            setSavingCompetenciasId(id);
            const { error } = await supabase
                .from('collaborators')
                .update({ competencias: text })
                .eq('id', id);

            if (error) throw error;
            toast.success('Competências atualizadas com sucesso!');
        } catch (error) {
            console.error('Error saving competencias:', error);
            toast.error('Erro ao salvar competências');
        } finally {
            setSavingCompetenciasId(null);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        // Draggable is the collaborator being dragged
        const draggedColab = data.find(c => c.id === draggableId);
        if (!draggedColab) return;

        // The destination.droppableId is the ID of the new Leader
        const newLeaderId = destination.droppableId;

        // Prevent dragging to self or same role level if needed, but for now we just allow dropping onto any leader area
        if (draggableId === newLeaderId) {
            toast.error('Um colaborador não pode ser líder dele mesmo.');
            return;
        }

        // Attempt to save to Supabase
        try {
            setSavingId(draggableId);

            const leaderToUpdate = newLeaderId === 'unassigned' ? null : newLeaderId;

            const { error } = await supabase
                .from('collaborators')
                .update({ leader_id: leaderToUpdate })
                .eq('id', draggableId);

            if (error) throw error;

            // Update local state
            setData(prev => prev.map(c =>
                c.id === draggableId
                    ? { ...c, leader_id: leaderToUpdate || undefined }
                    : c
            ));

            // Show beautiful notification
            const leaderName = leaderToUpdate
                ? data.find(c => c.id === leaderToUpdate)?.name || 'novo líder'
                : 'nenhum';

            toast(
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-[#0a192f]">Hierarquia Atualizada!</span>
                    <span className="text-sm text-gray-600">
                        {draggedColab.name} agora responde para <strong className="text-[#1e3a8a]">{leaderName}</strong>.
                        Essa mudança já foi refletida no cadastro oficial.
                    </span>
                </div>,
                { duration: 4000 }
            );

        } catch (error) {
            console.error('Erro ao atualizar leader_id:', error);
            toast.error('Erro ao alterar hierarquia.');
            // Revert is automatic since we didn't update state if failed
        } finally {
            setSavingId(null);
        }
    };

    // Grouping logic for rendering
    const getSubordinates = (leaderId: string | null) => {
        return data.filter(c => (c.leader_id || null) === leaderId);
    };

    // Get Top Level Nodes (Partners or those explicitly set as top)
    const topLevelNodes = useMemo(() => {
        return data.filter(c => {
            const roleStr = String(c.role || '');
            // Partners are always top level
            if (roleStr.toLowerCase().includes('sócio')) return true;
            // Or anyone without a leader in the Juridico set
            return !c.leader_id;
        });
    }, [data]);

    // A recursive component to render the tree node
    const OrganogramNode = ({ colab, level = 0 }: { colab: ColaboradorCard, level?: number }) => {
        const subordinates = getSubordinates(colab.id);
        const roleStr = String(colab.role || 'Sem Cargo');

        const isSocio = roleStr.toLowerCase().includes('sócio');
        const isJuridico = JURIDICO_HIERARCHY.includes(roleStr) || isSocio || roleStr.toLowerCase().includes('advogado') || roleStr.toLowerCase().includes('estagiário');
        const isAdministrativo = !isJuridico || isSocio; // Socios appear on both, everyone else not juridico is admin

        if (activeTab === 'JURIDICO' && !isJuridico) return null;
        if (activeTab === 'ADMINISTRATIVO' && !isAdministrativo) return null;

        const isMatch = !searchQuery ||
            colab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            roleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(colab.equipe || '').toLowerCase().includes(searchQuery.toLowerCase());

        const getRank = (rStr: string) => {
            const r = rStr.trim();
            const index = JURIDICO_HIERARCHY.findIndex(h => h.toLowerCase() === r.toLowerCase());
            return index === -1 ? 999 : index;
        };

        const filteredSubordinates = subordinates.filter(c => {
            const r = String(c.role || '');
            const isS = r.toLowerCase().includes('sócio');
            const isJ = JURIDICO_HIERARCHY.includes(r) || isS || r.toLowerCase().includes('advogado') || r.toLowerCase().includes('estagiário');
            const isA = !isJ || isS;
            if (activeTab === 'JURIDICO' && !isJ) return false;
            if (activeTab === 'ADMINISTRATIVO' && !isA) return false;
            return true;
        });

        const sortedSubordinates = [...filteredSubordinates].sort((a, b) => {
            return getRank(String(a.role || '')) - getRank(String(b.role || ''));
        });

        const roleGroups: ColaboradorCard[][] = [];
        let currentRole: string | null = null;
        let currentGroup: ColaboradorCard[] = [];

        for (const sub of sortedSubordinates) {
            const rStr = String(sub.role || '');
            if (rStr !== currentRole) {
                if (currentGroup.length > 0) roleGroups.push(currentGroup);
                currentRole = rStr;
                currentGroup = [sub];
            } else {
                currentGroup.push(sub);
            }
        }
        if (currentGroup.length > 0) roleGroups.push(currentGroup);

        return (
            <div className={`flex flex-col items-center transition-opacity duration-300 ${!isMatch ? 'opacity-30 grayscale print:opacity-100 print:grayscale-0' : ''}`}>
                {/* The Droppable Area for this Leader */}
                <Droppable droppableId={colab.id} type="COLAB">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`relative flex flex-col items-center transition-all duration-300 w-[240px] z-10 group hover:z-50
                ${snapshot.isDraggingOver ? 'scale-105' : ''}`}
                        >
                            {/* Visual drop indicator */}
                            <div className={`absolute inset-0 -m-4 rounded-3xl transition-colors z-[-1]
                                ${snapshot.isDraggingOver ? 'bg-[#1e3a8a]/5 border-2 border-dashed border-[#1e3a8a]/30' : 'bg-transparent'}`}
                            />

                            <Draggable draggableId={colab.id} index={0}>
                                {(dragProvided, dragSnapshot) => (
                                    <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`flex flex-col items-center cursor-pointer w-full ${dragSnapshot.isDragging ? 'opacity-50 scale-105' : ''}`}
                                        onClick={() => setSelectedColabForModal(colab.fullData)}
                                        title="Clique para expandir perfil"
                                    >
                                        {/* Avatar Circular */}
                                        <div className="w-24 h-24 rounded-full bg-white shadow-md border-[3px] border-[#1e3a8a]/10 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:shadow-xl group-hover:scale-110 group-hover:border-[#1e3a8a]/30">
                                            {colab.photo_url || colab.foto_url ? (
                                                <img
                                                    src={colab.photo_url || colab.foto_url}
                                                    alt={colab.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#1e3a8a]/40">
                                                    <UserIcon className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name, Role and Practice Area */}
                                        <div className="mt-4 text-center px-2 flex flex-col items-center gap-1.5">
                                            <div>
                                                <h4 className="text-[13px] leading-tight font-black text-[#0a192f] tracking-tight">{colab.name}</h4>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1e3a8a] block mt-1">
                                                    {roleStr}
                                                </span>
                                            </div>
                                            {colab.equipe && colab.equipe !== 'Sem Equipe' && (
                                                <span className="inline-block px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-wider text-gray-500 shadow-sm truncate max-w-full">
                                                    {String(colab.equipe)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Hover Competências Card */}
                                        <div
                                            className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] w-[320px]"
                                            onClick={(e) => e.stopPropagation()} // Prevent modal from opening if they click inside the tooltip
                                        >
                                            <div className="bg-white p-5 rounded-3xl shadow-2xl border border-gray-100 flex flex-col gap-3 relative before:absolute before:top-1/2 before:-left-3 before:-translate-y-1/2 before:border-[12px] before:border-transparent before:border-r-white filter drop-shadow-xl animate-in slide-in-from-left-2">
                                                <label className="text-[10px] font-black text-[#0a192f] uppercase tracking-widest flex justify-between items-center">
                                                    Competências no Organograma
                                                    {savingCompetenciasId === colab.id && <Loader2 className="w-3 h-3 animate-spin text-[#1e3a8a]" />}
                                                </label>
                                                <textarea
                                                    value={colab.competencias}
                                                    onChange={(e) => updateCompetencias(colab.id, e.target.value)}
                                                    onBlur={() => saveCompetencias(colab.id, colab.competencias || '')}
                                                    placeholder="Descreva as competências deste colaborador..."
                                                    className="w-full text-xs p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none transition-all resize-none min-h-[90px] text-[#0a192f] leading-relaxed"
                                                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag conflict
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                {/* Render Lines and Subordinates (Horizontal Tree) */}
                {roleGroups.length > 0 && (
                    <div className="flex flex-col items-center mt-2 w-full">
                        {/* Vertical line down from parent */}
                        <div className="w-[2px] h-8 bg-gray-300"></div>

                        <div className="flex flex-col items-center w-full relative z-10">
                            {roleGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="flex justify-center w-full relative pb-16">
                                    {/* Line down to the NEXT group */}
                                    {groupIndex < roleGroups.length - 1 && (
                                        <div className="absolute top-0 left-1/2 w-[2px] h-full bg-gray-300 -translate-x-1/2 -z-10"></div>
                                    )}

                                    <div className="flex justify-center relative pt-4 w-full">
                                        {group.map((sub, index) => (
                                            <div key={sub.id} className="relative flex flex-col items-center px-4">
                                                {/* Horizontal connector lines */}
                                                {group.length > 1 && (
                                                    <>
                                                        {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-[2px] bg-gray-300 -mt-4"></div>}
                                                        {index < group.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-[2px] bg-gray-300 -mt-4"></div>}
                                                    </>
                                                )}
                                                {/* Vertical stem down to this node */}
                                                <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-gray-300 -mt-4 -translate-x-1/2"></div>

                                                <OrganogramNode colab={sub} level={level + 1} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    if (colsLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#1e3a8a]" />
                    <p className="text-sm font-bold text-[#0a192f] uppercase tracking-widest animate-pulse">Carregando Estrutura...</p>
                </div>
            </div>
        );
    }

    // Find pure top level nodes based on active tab
    const roots = topLevelNodes.filter(c => {
        const roleStr = String(c.role || '');
        const isSocio = roleStr.toLowerCase().includes('sócio');
        const isJuridico = JURIDICO_HIERARCHY.includes(roleStr) || isSocio || roleStr.toLowerCase().includes('advogado') || roleStr.toLowerCase().includes('estagiário');
        const isAdministrativo = !isJuridico || isSocio;

        if (activeTab === 'JURIDICO') return isJuridico;
        if (activeTab === 'ADMINISTRATIVO') return isAdministrativo;
        return false;
    });

    return (
        <div className={`${isMaximized ? 'fixed inset-0 z-[100] bg-white w-full h-full p-6 space-y-6 overflow-auto' : 'p-8 max-w-[1600px] mx-auto space-y-8'} animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen print:p-0 print:bg-white`}>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50 pointer-events-none" />

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

                {/* Top Controls: Search, Print, Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-end gap-4 relative z-10 w-full md:w-auto mt-4 md:mt-0 print:hidden">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar nome ou área..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] sm:text-sm transition-all shadow-sm"
                        />
                    </div>

                    {/* Print Button */}
                    <button
                        onClick={() => window.print()}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-all shadow-sm"
                        title="Imprimir / PDF"
                    >
                        <Printer className="w-5 h-5" />
                    </button>

                    {/* Maximize Button */}
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-all shadow-sm hidden md:flex"
                        title={isMaximized ? "Minimizar" : "Maximizar"}
                    >
                        {isMaximized ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>

                    <div className="w-px h-8 bg-gray-200 hidden md:block mx-1"></div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('JURIDICO')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'JURIDICO' ? 'bg-white text-[#1e3a8a] shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50 scale-95'}`}
                        >
                            Jurídico
                        </button>
                        <button
                            onClick={() => setActiveTab('ADMINISTRATIVO')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ADMINISTRATIVO' ? 'bg-white text-[#1e3a8a] shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50 scale-95'}`}
                        >
                            Administrativo
                        </button>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2 mt-4 md:mt-0 relative z-10 bg-gray-50 p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.1))}
                        className="p-2 hover:bg-white rounded-xl transition-colors text-gray-500 hover:text-[#1e3a8a] shadow-sm hover:shadow"
                        title="Reduzir Zoom"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-black text-[#0a192f] min-w-[3rem] text-center">
                        {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                        onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                        className="p-2 hover:bg-white rounded-xl transition-colors text-gray-500 hover:text-[#1e3a8a] shadow-sm hover:shadow"
                        title="Aumentar Zoom"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button
                        onClick={() => setZoomLevel(1)}
                        className="p-2 hover:bg-white rounded-xl transition-colors text-gray-500 hover:text-[#1e3a8a] shadow-sm hover:shadow"
                        title="Tamanho Original"
                    >
                        <span className="text-[10px] font-bold px-1 uppercase tracking-wider">100%</span>
                    </button>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800 text-sm font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                    <strong className="font-bold text-[#1e3a8a]">Dica:</strong> Arraste um colaborador para cima de outro para alterar sua subordinação (Líder). As alterações refletem imediatamente no cadastro oficial do colaborador. As competências digitadas são salvas automaticamente após você terminar de digitar.
                </div>
            </div>

            {/* Main Drag Drop Context Area */}
            <div className="bg-gray-50/50 rounded-3xl border border-gray-100 flex-1 min-h-[500px] overflow-x-auto overflow-y-visible w-full min-w-full print:overflow-visible">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="p-8 min-w-full w-max mx-auto print:w-full">
                        <div
                            className="flex flex-col items-center gap-16 pb-32 transition-transform duration-300 min-w-max w-full"
                            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                        >
                            {roots.length > 0 ? (
                                roots.map((root, index) => (
                                    <div key={root.id} className="relative flex flex-col items-center w-full">
                                        <OrganogramNode colab={root} />
                                        {index < roots.length - 1 && <div className="w-full max-w-4xl h-[2px] bg-gray-200 mt-20"></div>}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">
                                    Nenhuma estrutura principal encontrada.
                                </div>
                            )}
                        </div>

                        {/* Unassigned or Orphan Nodes Pool */}
                        <div className="mt-16 pt-8 border-t border-gray-200">
                            <h3 className="text-sm font-black text-[#0a192f] uppercase tracking-wider mb-6">Colaboradores sem subordinação (ou raiz não-sócio)</h3>
                            <Droppable droppableId="unassigned" direction="horizontal" type="COLAB">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex flex-wrap gap-4 p-6 rounded-2xl border-2 border-dashed transition-all
                      ${snapshot.isDraggingOver ? 'border-[#1e3a8a] bg-blue-50/50' : 'border-gray-200 bg-white'}`}
                                    >
                                        {data.filter(c => {
                                            if (c.leader_id || roots.some(r => r.id === c.id)) return false;
                                            const roleStr = String(c.role || '');
                                            const isSocio = roleStr.toLowerCase().includes('sócio');
                                            const isJuridico = JURIDICO_HIERARCHY.includes(roleStr) || isSocio || roleStr.toLowerCase().includes('advogado') || roleStr.toLowerCase().includes('estagiário');
                                            const isAdministrativo = !isJuridico || isSocio;

                                            if (activeTab === 'JURIDICO' && !isJuridico) return false;
                                            if (activeTab === 'ADMINISTRATIVO' && !isAdministrativo) return false;
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
                                            if (c.leader_id || roots.some(r => r.id === c.id)) return false;
                                            const roleStr = String(c.role || '');
                                            const isSocio = roleStr.toLowerCase().includes('sócio');
                                            const isJuridico = JURIDICO_HIERARCHY.includes(roleStr) || isSocio || roleStr.toLowerCase().includes('advogado') || roleStr.toLowerCase().includes('estagiário');
                                            const isAdministrativo = !isJuridico || isSocio;

                                            if (activeTab === 'JURIDICO' && !isJuridico) return false;
                                            if (activeTab === 'ADMINISTRATIVO' && !isAdministrativo) return false;
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
        </div>
    );
}
