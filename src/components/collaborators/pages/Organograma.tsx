import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useColaboradores } from '../hooks/useColaboradores';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Network, Search, AlertCircle, Save, Loader2, User as UserIcon } from 'lucide-react';
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
}

export function Organograma() {
    const { colaboradores, loading: colsLoading, fetchColaboradores } = useColaboradores();
    const [data, setData] = useState<ColaboradorCard[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savingCompetenciasId, setSavingCompetenciasId] = useState<string | null>(null);

    // Filter and sort collaborators based on Jurídico hierarchy initially
    // For now, we focus on Jurídico as requested, but all are loaded
    useEffect(() => {
        if (colaboradores.length > 0) {
            const mapped = colaboradores.map(c => ({
                id: c.id,
                name: c.name,
                role: typeof c.roles === 'object' ? c.roles?.name : c.role,
                equipe: typeof c.teams === 'object' ? c.teams?.name : c.equipe,
                leader_id: c.leader_id,
                competencias: c.competencias || '',
                photo_url: c.photo_url
            }));
            setData(mapped);
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
                    ? { ...c, leader_id: leaderToUpdate }
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

        const isJuridico = JURIDICO_HIERARCHY.includes(roleStr) || roleStr.toLowerCase().includes('sócio') || roleStr.toLowerCase().includes('advogado') || roleStr.toLowerCase().includes('estagiário');

        // Filter to only show Juridico for now as requested, or adjust if Administrativo is needed
        if (!isJuridico) return null;

        return (
            <div className="flex flex-col items-center">
                {/* The Droppable Area for this Leader */}
                <Droppable droppableId={colab.id} type="COLAB">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 w-[300px] shadow-sm relative z-10 
                ${snapshot.isDraggingOver ? 'border-[#1e3a8a] bg-blue-50/50 scale-105 shadow-xl' : 'border-gray-100 bg-white hover:border-[#1e3a8a]/30'}`}
                        >
                            <Draggable draggableId={colab.id} index={0}>
                                {(dragProvided, dragSnapshot) => (
                                    <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`flex flex-col gap-3 ${dragSnapshot.isDragging ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {colab.photo_url ? (
                                                <img
                                                    src={colab.photo_url}
                                                    alt={colab.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md bg-gray-50 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-blue-50 flex items-center justify-center flex-shrink-0 text-[#1e3a8a]">
                                                    <UserIcon className="w-6 h-6" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-[#0a192f] truncate">{colab.name}</h4>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#1e3a8a] truncate block">
                                                    {roleStr}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                                                Competências
                                                {savingCompetenciasId === colab.id && <Loader2 className="w-3 h-3 animate-spin text-[#1e3a8a]" />}
                                            </label>
                                            <textarea
                                                value={colab.competencias}
                                                onChange={(e) => updateCompetencias(colab.id, e.target.value)}
                                                onBlur={() => saveCompetencias(colab.id, colab.competencias || '')}
                                                placeholder="Descreva as competências..."
                                                className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition-all resize-none min-h-[60px]"
                                                onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when typing
                                            />
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                            {provided.placeholder}

                            {snapshot.isDraggingOver && (
                                <div className="absolute inset-0 bg-[#1e3a8a]/5 rounded-xl border-dashed border-2 border-[#1e3a8a]/30 pointer-events-none z-[-1]" />
                            )}
                        </div>
                    )}
                </Droppable>

                {/* Render Lines and Subordinates */}
                {subordinates.length > 0 && (
                    <div className="flex flex-col items-center mt-4">
                        {/* Vertical line down */}
                        <div className="w-px h-6 bg-gray-300"></div>

                        <div className="flex gap-8 relative pt-4">
                            {/* Horizontal line connecting siblings (only if > 1) */}
                            {subordinates.length > 1 && (
                                <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                            )}

                            {subordinates.map((sub, index) => (
                                <div key={sub.id} className="flex flex-col items-center relative">
                                    {/* Vertical line up from sibling (if > 1) */}
                                    {subordinates.length > 1 && (
                                        <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-300 -mt-4"></div>
                                    )}
                                    {/* Vertical line up from single child */}
                                    {subordinates.length === 1 && (
                                        <div className="absolute top-0 left-1/2 w-px h-4 bg-gray-300 -mt-4"></div>
                                    )}

                                    <OrganogramNode colab={sub} level={level + 1} />
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

    // Find pure top level nodes for Jurídico
    // To avoid unlinked loops or missing nodes, we might need to render those who are Juridico but have no valid leader in data
    const roots = topLevelNodes.filter(c => {
        const roleStr = String(c.role || '');
        return JURIDICO_HIERARCHY.includes(roleStr) || roleStr.toLowerCase().includes('sócio') || roleStr.toLowerCase().includes('advogado');
    });

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-auto min-h-screen">

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
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800 text-sm font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                    <strong className="font-bold text-[#1e3a8a]">Dica:</strong> Arraste um colaborador para cima de outro para alterar sua subordinação (Líder). As alterações refletem imediatamente no cadastro oficial do colaborador. As competências digitadas são salvas automaticamente após você terminar de digitar.
                </div>
            </div>

            {/* Main Drag Drop Context Area */}
            <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 min-w-max">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex justify-center gap-16 pb-32">
                        {roots.length > 0 ? (
                            roots.map(root => (
                                <OrganogramNode key={root.id} colab={root} />
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">
                                Nenhuma estrutura Jurídica principal encontrada.
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
                                    {data.filter(c => !c.leader_id && !roots.includes(c) && (JURIDICO_HIERARCHY.includes(String(c.role)) || String(c.role).toLowerCase().includes('advogado') || String(c.role).toLowerCase().includes('estagiário'))).map((colab, index) => (
                                        <Draggable key={colab.id} draggableId={colab.id} index={index}>
                                            {(dragProvided, dragSnapshot) => (
                                                <div
                                                    ref={dragProvided.innerRef}
                                                    {...dragProvided.draggableProps}
                                                    {...dragProvided.dragHandleProps}
                                                    className={`p-3 rounded-xl border border-gray-200 bg-white shadow-sm w-[250px]
                                ${dragSnapshot.isDragging ? 'shadow-xl opacity-50' : 'hover:border-[#1e3a8a]/30'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {colab.photo_url ? (
                                                            <img src={colab.photo_url} alt={colab.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1e3a8a]">
                                                                <UserIcon className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-bold text-[#0a192f] truncate">{colab.name}</h4>
                                                            <span className="text-[9px] font-black uppercase text-[#1e3a8a] truncate block tracking-wider">{String(colab.role)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {data.filter(c => !c.leader_id && !roots.includes(c) && (JURIDICO_HIERARCHY.includes(String(c.role)) || String(c.role).toLowerCase().includes('advogado') || String(c.role).toLowerCase().includes('estagiário'))).length === 0 && (
                                        <div className="w-full text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-8">
                                            Todos estão alocados.
                                        </div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
}
