import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Collaborator } from '../../../types/controladoria';
import { User, MapPin, MousePointer2, Users, Trash2, Save, Copy, ZoomIn, ZoomOut, Crop, Square, Minus, DoorOpen } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface MapElement {
  id: string; // uuid
  type: 'wall' | 'line' | 'seat' | 'text' | 'door';
  x: number;
  y: number;
  width: number;
  height: number;
  custom_data?: {
    postoId?: string; // e.g. "S01"
    seatType?: string; // e.g. "SÊNIOR"
    textValue?: string; // for labels
    isVacant?: boolean; // manual flag marking the seat as vacant
    isRotativo?: boolean; // manual flag marking the seat as hotdesking
  }
}

interface FloorPlanProps {
  collaborators: Collaborator[];
  mapElements: MapElement[]; // new prop containing the entire map config
  isEditMode?: boolean;
  onAssignSeat: (collaboratorId: string, seatId: string) => void;
  onRemoveSeat: (collaboratorId: string) => void;
  onSaveMap: (elements: MapElement[]) => void;
}

const W_STD = 75;
const H_STD = 40;

export function RHMapaAndar31({ 
  collaborators, 
  mapElements,
  isEditMode = false,
  onAssignSeat, 
  onRemoveSeat,
  onSaveMap
}: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // STUDIO MODE STATE
  const [elements, setElements] = useState<MapElement[]>([]);
  // Use a fixed natural size for the background map (e.g. 2600 x 1800)
  const [mapW, setMapW] = useState(2600); 
  const [mapH, setMapH] = useState(1800);
  const [activeTool, setActiveTool] = useState<'select' | 'seat' | 'wall' | 'line' | 'door'>('select');
  const [zoomScale, setZoomScale] = useState(1.15);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{startX: number, startY: number, curX: number, curY: number} | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [drawingPath, setDrawingPath] = useState<{startX: number, startY: number, curX: number, curY: number} | null>(null);
  const [movingElement, setMovingElement] = useState<{ id: string, startX: number, startY: number, initialPositions: Record<string, {x: number, y: number}> } | null>(null);
  const [mapResizing, setMapResizing] = useState<{ startX: number, startY: number, startW: number, startH: number } | null>(null);
  const [clipboard, setClipboard] = useState<MapElement[] | null>(null);
  
  // Combobox do Inspetor
  const [searchOccupant, setSearchOccupant] = useState('');
  const [occupantDropdownOpen, setOccupantDropdownOpen] = useState(false);

  // Sync props -> state on load se não houver edições não salvas
  useEffect(() => {
    if (!unsavedChanges) {
      const loadedElems = mapElements || [];
      setElements(loadedElems);
    }
  }, [mapElements, unsavedChanges]);

  // Remove infinite expansion logic as floor maps are fixed bounds
  useEffect(() => {
    // Dynamic resizing disabled.
  }, [elements, mapW, mapH, isEditMode]);

  // Keyboard Shortcuts (Copy & Paste & Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isEditMode) return;
        
        // Ignore se estiver digitando em input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            if (selectedIds.length > 0) {
                const elsToCopy = elements.filter(el => selectedIds.includes(el.id));
                setClipboard(elsToCopy);
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
            if (clipboard && clipboard.length > 0) {
                const newEls: MapElement[] = [];
                const newIds: string[] = [];
                clipboard.forEach(clipEl => {
                    const newId = crypto.randomUUID();
                    newEls.push({
                        ...clipEl,
                        id: newId,
                        x: clipEl.x + 20,
                        y: clipEl.y + 20,
                        custom_data: clipEl.type === 'seat' ? { ...clipEl.custom_data, postoId: 'NOVO' } : { ...clipEl.custom_data }
                    });
                    newIds.push(newId);
                });
                setElements(prev => [...prev, ...newEls]);
                setSelectedIds(newIds);
                setClipboard(newEls); // atualiza para que o próximo paste ande mais 20px
                setUnsavedChanges(true);
            }
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedIds.length > 0) {
                setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
                setSelectedIds([]);
                setUnsavedChanges(true);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, selectedIds, elements, clipboard]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    
    // Se clicou com botão direito não desenha
    if (e.button !== 0) return;

    if (activeTool === 'select') {
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = contentRef.current?.getBoundingClientRect();
        if (!rect) return;
        const scale = zoomScale;
        const clickX = (e.clientX - rect.left) / scale;
        const clickY = (e.clientY - rect.top) / scale;
        
        setSelectionBox({ startX: clickX, startY: clickY, curX: clickX, curY: clickY });
        
        if (!e.shiftKey) {
            setSelectedIds([]);
        }
        return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoomScale;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    setDrawingPath({ startX: clickX, startY: clickY, curX: clickX, curY: clickY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectionBox) {
        const rect = contentRef.current?.getBoundingClientRect();
        if (!rect) return;
        const scale = zoomScale;
        const curX = (e.clientX - rect.left) / scale;
        const curY = (e.clientY - rect.top) / scale;
        setSelectionBox(prev => prev ? { ...prev, curX, curY } : null);
        return;
    }

    if (!drawingPath) return;

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoomScale;
    const curX = (e.clientX - rect.left) / scale;
    const curY = (e.clientY - rect.top) / scale;

    setDrawingPath(prev => prev ? { ...prev, curX, curY } : null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectionBox) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        
        const dx = Math.abs(selectionBox.curX - selectionBox.startX);
        const dy = Math.abs(selectionBox.curY - selectionBox.startY);
        
        if (dx > 5 && dy > 5) {
            const minX = Math.min(selectionBox.startX, selectionBox.curX);
            const maxX = Math.max(selectionBox.startX, selectionBox.curX);
            const minY = Math.min(selectionBox.startY, selectionBox.curY);
            const maxY = Math.max(selectionBox.startY, selectionBox.curY);
            
            const newlySelected = elements.filter(el => {
                const elRight = el.x + el.width;
                const elBottom = el.y + el.height;
                return !(el.x > maxX || elRight < minX || el.y > maxY || elBottom < minY);
            }).map(el => el.id);
            
            setSelectedIds(prev => {
                if (e.shiftKey) {
                    return Array.from(new Set([...prev, ...newlySelected]));
                }
                return newlySelected;
            });
        } else if (!e.shiftKey) {
             setSelectedIds([]);
        }
        
        setSelectionBox(null);
        return;
    }

    if (!drawingPath) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const dx = Math.abs(drawingPath.curX - drawingPath.startX);
    const dy = Math.abs(drawingPath.curY - drawingPath.startY);

    let finalX: number;
    let finalY: number;

    if (dx < 10 && dy < 10) {
        finalX = drawingPath.startX;
        finalY = drawingPath.startY;
    } else {
        finalX = Math.min(drawingPath.startX, drawingPath.curX);
        finalY = Math.min(drawingPath.startY, drawingPath.curY);
    }

    let finalW = activeTool === 'seat' ? W_STD : (dx > 5 ? dx : (activeTool === 'wall' ? 100 : (activeTool === 'line' ? 200 : 40)));
    let finalH = activeTool === 'seat' ? H_STD : (dy > 5 ? dy : (activeTool === 'wall' ? 100 : (activeTool === 'line' ? 3 : 5)));

    if (activeTool === 'line') {
        if (finalW > finalH) finalH = 3; else finalW = 3;
    }

    const newEl: MapElement = {
        id: crypto.randomUUID(),
        type: activeTool as MapElement['type'],
        x: Math.round(finalX || 0),
        y: Math.round(finalY || 0),
        width: Math.round(finalW),
        height: Math.round(finalH),
        custom_data: { postoId: 'NOVO', seatType: 'PLENO' }
    };

    setElements(prev => [...prev, newEl]);
    setSelectedIds([newEl.id]);
    setActiveTool('select');
    setUnsavedChanges(true);
    setDrawingPath(null);
  };

  const updateElement = (id: string, updates: Partial<MapElement>) => {
      setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
      setUnsavedChanges(true);
  };

  const handleElementPointerDown = (e: React.PointerEvent<HTMLDivElement>, el: MapElement) => {
    if (!isEditMode || activeTool !== 'select') return;
    e.stopPropagation();
    
    // Se o elemento clicado não está na seleção, a seleção passa a ser apenas ele (ou add se shift)
    if (!selectedIds.includes(el.id)) {
        if (e.shiftKey) {
            setSelectedIds(prev => [...prev, el.id]);
        } else {
            setSelectedIds([el.id]);
        }
    }

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoomScale;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    // Guarda a posição inicial de todos os elementos selecionados para podermos somar o delta de arrasto neles todos
    const selectedElementsNodes = elements.filter(item => selectedIds.includes(item.id) || item.id === el.id);
    const initialPositions = selectedElementsNodes.reduce((acc, curr) => {
        acc[curr.id] = { x: curr.x, y: curr.y };
        return acc;
    }, {} as Record<string, {x: number, y: number}>);

    setMovingElement({ id: el.id, startX: clickX, startY: clickY, initialPositions });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleElementPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!movingElement) return;
    e.stopPropagation();
    
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoomScale;
    const curX = (e.clientX - rect.left) / scale;
    const curY = (e.clientY - rect.top) / scale;
    
    const dx = curX - movingElement.startX;
    const dy = curY - movingElement.startY;

    // Atualiza todos os nós selecionados ao mesmo tempo
    setElements(prev => prev.map(item => {
        if (movingElement.initialPositions[item.id]) {
            return {
                ...item,
                x: Math.round(movingElement.initialPositions[item.id].x + dx),
                y: Math.round(movingElement.initialPositions[item.id].y + dy)
            };
        }
        return item;
    }));
    setUnsavedChanges(true);
  };

  const handleElementPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!movingElement) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    setMovingElement(null);
  };

  const [resizingElement, setResizingElement] = useState<{ id: string, startX: number, startY: number, startW: number, startH: number } | null>(null);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, el: MapElement) => {
      e.stopPropagation();
      if (!isEditMode || activeTool !== 'select') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / zoomScale;
      const y = (e.clientY - rect.top) / zoomScale;
      setResizingElement({ id: el.id, startX: x, startY: y, startW: el.width, startH: el.height });
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!resizingElement) return;
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return;
      const currentX = (e.clientX - rect.left) / zoomScale;
      const currentY = (e.clientY - rect.top) / zoomScale;
      const deltaX = currentX - resizingElement.startX;
      const deltaY = currentY - resizingElement.startY;
      const el = elements.find(item => item.id === resizingElement.id);
      if (!el) return;

      let newW = Math.max(10, Math.round((resizingElement.startW + deltaX) / 10) * 10);
      let newH = Math.max(10, Math.round((resizingElement.startH + deltaY) / 10) * 10);

      if (el.type === 'line') {
          if (resizingElement.startW > resizingElement.startH) {
              newH = 3; // mantem grossura horizontal
          } else {
              newW = 3; // mantem grossura vertical
          }
      }

      setElements(prev => prev.map(item => item.id === resizingElement.id ? { ...item, width: newW, height: newH } : item));
      setUnsavedChanges(true);
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (resizingElement) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setResizingElement(null);
      }
  };

  const handleMapResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setMapResizing({ startX: e.clientX, startY: e.clientY, startW: mapW, startH: mapH });
  };

  const handleMapResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!mapResizing) return;
      const deltaX = (e.clientX - mapResizing.startX) / zoomScale;
      const deltaY = (e.clientY - mapResizing.startY) / zoomScale;
      setMapW(Math.max(500, Math.round(mapResizing.startW + deltaX)));
      setMapH(Math.max(500, Math.round(mapResizing.startH + deltaY)));
  };

  const handleMapResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (mapResizing) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setMapResizing(null);
          setUnsavedChanges(true);
      }
  };

  const handleCropMap = () => {
     let maxX = 500;
     let maxY = 500;
     elements.forEach(el => {
         if (el.x + el.width > maxX) maxX = el.x + el.width;
         if (el.y + el.height > maxY) maxY = el.y + el.height;
     });
     setMapW(Math.round(maxX + 60)); // Adiciona uma margem
     setMapH(Math.round(maxY + 60));
     setUnsavedChanges(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedIds.length === 0) return;
      setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
      setSelectedIds([]);
      setUnsavedChanges(true);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedIds.length === 0) return;
      
      const elsToCopy = elements.filter(item => selectedIds.includes(item.id));
      if (elsToCopy.length === 0) return;

      const newEls: MapElement[] = [];
      const newIds: string[] = [];
      
      elsToCopy.forEach(el => {
          const newId = crypto.randomUUID();
          newEls.push({
              ...el,
              id: newId,
              x: el.x + 20,
              y: el.y + 20,
              custom_data: el.type === 'seat' ? { ...el.custom_data, postoId: 'NOVO' } : { ...el.custom_data }
          });
          newIds.push(newId);
      });
      
      setElements(prev => [...prev, ...newEls]);
      setSelectedIds(newIds);
      setUnsavedChanges(true);
  };

  const handleSave = () => {
      onSaveMap(elements);
      setUnsavedChanges(false);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDropFromList = (e: React.DragEvent, seatId: string) => {
    e.preventDefault();
    if (isEditMode) return; 
    const colabId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('colabId');
    if (colabId && seatId && seatId !== 'NOVO') {
      onAssignSeat(colabId, seatId);
    }
  };

  const seatsMap = useMemo(() => {
    const map = new Map<string, Collaborator[]>();
    collaborators.forEach(c => {
      if (c.posto) {
        const pId = c.posto.toUpperCase();
        if (!map.has(pId)) map.set(pId, []);
        map.get(pId)!.push(c);
      }
    });
    return map;
  }, [collaborators]);


  const selectedEl = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;

  return (
    <div 
      ref={containerRef}
      className={`w-full relative bg-gray-50 border border-gray-200 rounded-lg shadow-inner overflow-auto custom-scrollbar transition-all ${isEditMode ? 'ring-4 ring-blue-500/30 min-h-[70vh]' : 'min-h-[500px] h-[80vh]'}`}
    >
      {/* STUDIO TOOLBAR TELEPORTED TO HEADER */}
      {isEditMode && document.getElementById('map-toolbar-portal') && createPortal(
          <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl shadow-sm border border-gray-200 ml-4 animate-in fade-in zoom-in duration-300">
              {/* TOOL: SELECT */}
              <button onClick={(e) => { e.stopPropagation(); setActiveTool('select'); }} className={`p-2 rounded-lg transition-all ${activeTool === 'select' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`} title="Selecionar / Mover (Shift + Click p/ Múltiplos)">
                  <MousePointer2 className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-0.5"></div>

              {/* TOOL: SEAT */}
              <button onClick={() => setActiveTool('seat')} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${activeTool === 'seat' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`} title="Adicionar Mesa/Posto (Circular)">
                  <Users className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-wide hidden sm:inline">Mesa</span>
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-0.5"></div>

              {/* TOOL: WALL */}
              <button onClick={() => setActiveTool('wall')} className={`p-2 rounded-lg transition-all ${activeTool === 'wall' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`} title="Desenhar Parede / Bloco">
                  <Square className="w-4 h-4" />
              </button>

              {/* TOOL: LINE */}
              <button onClick={() => setActiveTool('line')} className={`p-2 rounded-lg transition-all ${activeTool === 'line' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`} title="Desenhar Linha Fina">
                  <Minus className="w-4 h-4" />
              </button>

              {/* TOOL: DOOR */}
              <button onClick={() => setActiveTool('door')} className={`p-2 rounded-lg transition-all ${activeTool === 'door' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`} title="Adicionar Porta">
                  <DoorOpen className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-gray-200 mx-1"></div>

              {/* ACTION: SAVE */}
              <button onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={!unsavedChanges} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${unsavedChanges ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  <Save className="w-4 h-4" /> <span className="text-[10px] uppercase tracking-wide font-black">Salvar</span>
              </button>
          </div>,
          document.getElementById('map-toolbar-portal')!
      )}

      {/* SELECTION PROPERTIES INSPECTOR (FLOTING RIGHT) */}
      {isEditMode && selectedIds.length > 0 && activeTool === 'select' && (
        <div className="fixed top-28 right-12 z-[200] pointer-events-none">
          <div className="bg-white p-3 pt-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.16)] border border-gray-200 w-64 pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {selectedIds.length > 1 ? (
                // BATCH ACTIONS
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1 pb-2 border-b border-gray-100">
                        <span className="text-xs font-black text-indigo-800 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">
                            {selectedIds.length} Itens
                        </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mb-2 leading-tight">Vários elementos selecionados. Ações em lote:</div>
                    <button onClick={handleDuplicate} className="w-full py-2 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold text-xs uppercase hover:bg-blue-500 hover:text-white rounded-lg transition-colors border border-blue-100">
                        <Copy className="w-4 h-4" /> Duplicar Grupo
                    </button>
                    <button onClick={handleDelete} className="w-full py-2 flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold text-xs uppercase hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100">
                        <Trash2 className="w-4 h-4" /> Excluir Grupo
                    </button>
                </div>
            ) : selectedEl ? (
                // INDIVIDUAL PROPERTIES
                <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                        <span className="text-xs font-black text-gray-800 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
                            {selectedEl.type === 'wall' ? 'Parede / Sala' : selectedEl.type === 'line' ? 'Divisória' : 'Posto (Mesa)'}
                        </span>
                        <div className="flex gap-1.5 items-center">
                            <button onClick={handleDuplicate} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors" title="Duplicar (Ctrl+C / Ctrl+V)">
                                <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={handleDelete} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Excluir Elemento (Del)">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Properties Removed - Fixed Circular Standard Width/Height */}
                    {selectedEl.type === 'seat' && (() => {
                        const postoId = selectedEl.custom_data?.postoId || 'NOVO';
                        const currentOccupants = postoId !== 'NOVO' ? collaborators.filter(c => c.posto?.toUpperCase() === postoId.toUpperCase()) : [];
                        const isRotativo = selectedEl.custom_data?.isRotativo;
                        
                        const filteredCollaborators = collaborators.filter(c => {
                            if (c.status !== 'active' && (c.status as any) !== 'Ativo') return false;
                            const locName = (c as any).locations?.name || c.local || '';
                            if (!locName.includes('Rio de Janeiro')) return false;
                            if (searchOccupant && !c.name.toLowerCase().includes(searchOccupant.toLowerCase())) return false;
                            return true;
                        }).sort((a,b) => a.name.localeCompare(b.name));

                        return (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-indigo-500">ID do Posto (Ex: S01)</label>
                                    <input type="text" value={postoId === 'NOVO' ? '' : postoId} placeholder="NOVO" onChange={e => updateElement(selectedIds[0], { custom_data: { ...selectedEl.custom_data, postoId: e.target.value.toUpperCase() || 'NOVO' } })} className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm font-black text-indigo-900 bg-indigo-50 focus:outline-none focus:bg-white" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Tipo / Hierarquia</label>
                                    <select 
                                        value={selectedEl.custom_data?.seatType || 'PLENO'} 
                                        onChange={e => updateElement(selectedIds[0], { custom_data: { ...selectedEl.custom_data, seatType: e.target.value } })}
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 focus:outline-none"
                                    >
                                        <option value="SÓCIO">SÓCIO</option>
                                        <option value="CONSULTOR">CONSULTOR</option>
                                        <option value="SÊNIOR">SÊNIOR</option>
                                        <option value="PLENO">PLENO</option>
                                        <option value="JÚNIOR">JÚNIOR</option>
                                        <option value="ESTAGIÁRIO">ESTAGIÁRIO</option>
                                        <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                                    </select>
                                </div>

                                {/* Integrante Combobox */}
                                <div className="flex flex-col gap-1 relative mt-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Ocupante(s) da Mesa</label>
                                    
                                    {currentOccupants.length > 0 && (
                                        <div className="flex flex-col gap-1.5 mb-1">
                                            {currentOccupants.map(occ => (
                                                <div key={occ.id} className="flex items-center gap-2 w-full border border-emerald-200 bg-emerald-50 rounded-lg p-2 group transition-all">
                                                    {occ.foto_url || occ.photo_url ? (
                                                        <img src={occ.foto_url || occ.photo_url} alt={occ.name} className="w-6 h-6 rounded-full object-cover border border-emerald-200 shrink-0" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 shrink-0">
                                                            <User className="w-3 h-3 text-emerald-600" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-emerald-900 truncate" title={occ.name}>{occ.name}</p>
                                                        <p className="text-[9px] text-emerald-600 truncate uppercase tracking-wider">{occ.roles?.name || (occ as any).role}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => { onRemoveSeat(occ.id); if(!isRotativo) setOccupantDropdownOpen(true); }}
                                                        className="p-1.5 text-emerald-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                                                        title="Remover Ocupante"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {((currentOccupants.length === 0 && !selectedEl.custom_data?.isVacant) || (isRotativo && occupantDropdownOpen)) ? (
                                        <div className="w-full">
                                            <input 
                                                type="text" 
                                                value={searchOccupant}
                                                onChange={(e) => { setSearchOccupant(e.target.value); setOccupantDropdownOpen(true); }}
                                                onFocus={() => setOccupantDropdownOpen(true)}
                                                placeholder="Buscar nome do integrante..."
                                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-gray-400"
                                            />
                                            {occupantDropdownOpen && (
                                                <div className="relative mt-2 w-full max-h-48 overflow-y-auto bg-gray-50 border border-gray-200 shadow-inner rounded-xl z-[200] custom-scrollbar">
                                                    {filteredCollaborators.length > 0 ? filteredCollaborators.map(c => (
                                                        <div 
                                                            key={c.id} 
                                                            onClick={() => {
                                                                if (postoId !== 'NOVO') {
                                                                    onAssignSeat(c.id, postoId);
                                                                    setSearchOccupant('');
                                                                    setOccupantDropdownOpen(false);
                                                                } else {
                                                                    alert('Renomeie o ID do Posto (Ex: S01) antes de associar um membro.');
                                                                }
                                                            }}
                                                            className={`flex items-center gap-2 p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 ${c.posto ? 'opacity-50' : ''}`}
                                                        >
                                                            {c.foto_url || c.photo_url ? (
                                                                <img src={c.foto_url || c.photo_url} alt={c.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                                    <User className="w-2.5 h-2.5 text-gray-500" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold text-gray-800 truncate" title={c.name}>{c.name}</p>
                                                                <p className="text-[8px] text-gray-500 truncate uppercase mt-0.5">{c.posto ? `Ocupando: ${c.posto}` : 'Sem Mesa'}</p>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="p-3 text-[10px] text-center text-gray-500">Nenhum integrante livre encontrado no Rio.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (isRotativo && !occupantDropdownOpen && !selectedEl.custom_data?.isVacant) ? (
                                        <button onClick={() => setOccupantDropdownOpen(true)} className="w-full border border-dashed border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100 text-[10px] font-bold py-2 rounded-lg transition-colors">
                                            + ADICIONAR INTEGRANTE
                                        </button>
                                    ) : null}
                                </div>
                                {occupantDropdownOpen && <div className="fixed inset-0 z-[190]" onClick={() => setOccupantDropdownOpen(false)}></div>}
                                
                                {/* Flags Checkboxes */}
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-1.5 p-2 py-2.5 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors w-full">
                                        <input 
                                            type="checkbox" 
                                            checked={!!selectedEl.custom_data?.isVacant}
                                            onChange={e => updateElement(selectedIds[0], { custom_data: { ...selectedEl.custom_data, isVacant: e.target.checked } })}
                                            className="w-4 h-4 text-amber-500 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                                        />
                                        <span className="text-[9px] uppercase font-black text-amber-800 tracking-wider">Vago</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-1.5 p-2 py-2.5 border border-orange-200 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors w-full">
                                        <input 
                                            type="checkbox" 
                                            checked={!!selectedEl.custom_data?.isRotativo}
                                            onChange={e => updateElement(selectedIds[0], { custom_data: { ...selectedEl.custom_data, isRotativo: e.target.checked } })}
                                            className="w-4 h-4 text-orange-500 rounded border-orange-300 focus:ring-orange-500 cursor-pointer"
                                        />
                                        <span className="text-[9px] uppercase font-black text-orange-800 tracking-wider">Rotativo</span>
                                    </label>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Specifics: Text Fields */}
                    {selectedEl.type === 'text' && (
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500">Conteúdo do Texto</label>
                                <input type="text" value={selectedEl.custom_data?.textValue || ''} onChange={e => updateElement(selectedIds[0], { custom_data: { ...selectedEl.custom_data, textValue: e.target.value } })} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-black text-gray-800 focus:outline-none focus:bg-white" />
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ZOOM CONTROLS */}
      <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/60 flex flex-col items-center gap-1 z-[100] transition-opacity hover:opacity-100 opacity-70">
        <button onClick={() => setZoomScale(prev => Math.min(prev + 0.15, 2.5))} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-700 transition-colors" title="Aumentar Zoom">
            <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-full h-px bg-gray-200/60 px-2 my-0.5"></div>
        <div className="text-[10px] font-black text-center text-gray-500 py-0.5 select-none w-10">{Math.round(zoomScale * 100)}%</div>
        <div className="w-full h-px bg-gray-200/60 px-2 my-0.5"></div>
        <button onClick={() => setZoomScale(prev => Math.max(prev - 0.15, 0.4))} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-700 transition-colors" title="Diminuir Zoom">
            <ZoomOut className="w-5 h-5" />
        </button>
        {isEditMode && (
          <>
            <div className="w-full h-px bg-gray-200/60 px-2 my-0.5"></div>
            <button onClick={handleCropMap} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-700 transition-colors" title="Recortar Fundo (Otimizar tamanho da lousa)">
              <Crop className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div id="mapa-31-andar-wrapper" className="mx-auto" style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center', padding: isEditMode ? '20px 0' : '0', width: mapW * zoomScale, height: mapH * zoomScale, flexShrink: 0, transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), width 0.2s cubic-bezier(0.2, 0, 0, 1), height 0.2s cubic-bezier(0.2, 0, 0, 1)' }}>
        <div 
          ref={contentRef}
          id="mapa-31-andar-content"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative select-none rounded-xl shadow-md ring-1 ring-gray-200 mx-auto ${activeTool !== 'select' && isEditMode ? 'cursor-crosshair' : ''}`}
          style={{ 
            width: mapW, 
            height: mapH, 
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            backgroundImage: isEditMode ? 'radial-gradient(#e5e7eb 1px, transparent 1px)' : 'none',
            backgroundSize: '20px 20px',
            backgroundRepeat: 'repeat',
            backgroundPosition: '0 0'
          }}
        >
          {/* SELECTION BOX (Arrastar e Multi-Selecionar) */}
          {selectionBox && (
              <div 
                  className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-[100]"
                  style={{
                      left: Math.min(selectionBox.startX, selectionBox.curX),
                      top: Math.min(selectionBox.startY, selectionBox.curY),
                      width: Math.abs(selectionBox.curX - selectionBox.startX),
                      height: Math.abs(selectionBox.curY - selectionBox.startY)
                  }}
              />
          )}

          {elements.map(el => {
              
            const isSelected = selectedIds.includes(el.id);
            const selectionClasses = isSelected && isEditMode ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : '';

            // RENDER WALL
            if (el.type === 'wall') {
                return (
                    <div
                        key={el.id}
                        onPointerDown={(e) => handleElementPointerDown(e, el)}
                        onPointerMove={handleElementPointerMove}
                        onPointerUp={handleElementPointerUp}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height }}
                        className={`border-2 border-gray-800 bg-gray-50/50 transition-none ${selectionClasses} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                        {isSelected && isEditMode && activeTool === 'select' && (
                            <div 
                                onPointerDown={(e) => handleResizePointerDown(e, el)}
                                onPointerMove={handleResizePointerMove}
                                onPointerUp={handleResizePointerUp}
                                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white cursor-se-resize shadow-sm ring-1 ring-black/10 rounded-full z-[100]"
                                title="Redimensionar Parede"
                            />
                        )}
                    </div>
                );
            }

            // RENDER LINE
            if (el.type === 'line') {
                return (
                    <div
                        key={el.id}
                        onPointerDown={(e) => handleElementPointerDown(e, el)}
                        onPointerMove={handleElementPointerMove}
                        onPointerUp={handleElementPointerUp}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height }}
                        className={`bg-gray-800 transition-none ${selectionClasses} ${isSelected ? 'h-[4px] -my-[1px]' : ''} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                        {isSelected && isEditMode && activeTool === 'select' && (
                            <div 
                                onPointerDown={(e) => handleResizePointerDown(e, el)}
                                onPointerMove={handleResizePointerMove}
                                onPointerUp={handleResizePointerUp}
                                className="absolute -top-[2px] -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white cursor-ew-resize shadow-sm ring-1 ring-black/10 rounded-full z-[100]"
                                title="Esticar Linha"
                            />
                        )}
                    </div>
                );
            }

            // RENDER DOOR
            if (el.type === 'door') {
                return (
                    <div
                        key={el.id}
                        onPointerDown={(e) => handleElementPointerDown(e, el)}
                        onPointerMove={handleElementPointerMove}
                        onPointerUp={handleElementPointerUp}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: 15 }}
                        className={`bg-white border text-[0px] transition-none ${selectionClasses ? selectionClasses : 'border-dashed border-gray-400 hover:border-gray-500'} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                        {isSelected && isEditMode && activeTool === 'select' && (
                            <div 
                                onPointerDown={(e) => handleResizePointerDown(e, el)}
                                onPointerMove={handleResizePointerMove}
                                onPointerUp={handleResizePointerUp}
                                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white cursor-se-resize shadow-sm ring-1 ring-black/10 rounded-full z-[100]"
                                title="Redimensionar Porta"
                            />
                        )}
                    </div>
                );
            }

            // RENDER TEXT
            if (el.type === 'text') {
                return (
                    <div
                        key={el.id}
                        onPointerDown={(e) => handleElementPointerDown(e, el)}
                        onPointerMove={handleElementPointerMove}
                        onPointerUp={handleElementPointerUp}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: 30 }}
                        className={`flex items-center justify-center transition-none bg-transparent ${selectionClasses} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 rounded-sm' : ''}`}
                    >
                        <span className="text-gray-900 font-bold whitespace-nowrap" style={{ fontSize: `${el.height * 0.7}px`, lineHeight: 1 }}>{el.custom_data?.textValue || 'Rótulo'}</span>
                        
                        {isSelected && isEditMode && activeTool === 'select' && (
                            <div 
                                onPointerDown={(e) => handleResizePointerDown(e, el)}
                                onPointerMove={handleResizePointerMove}
                                onPointerUp={handleResizePointerUp}
                                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white cursor-se-resize shadow-sm ring-1 ring-black/10 rounded-full z-[100]"
                                title="Mudar Tamanho do Texto"
                            />
                        )}
                    </div>
                );
            }

            // RENDER SEAT
            if (el.type === 'seat') {
                const postoId = el.custom_data?.postoId || 'NOVO';
                const seatType = el.custom_data?.seatType || 'PLENO';
                const occupants = seatsMap.get(postoId.toUpperCase()) || [];
                const isVacant = el.custom_data?.isVacant;
                const isRotativo = el.custom_data?.isRotativo;

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    onPointerMove={handleElementPointerMove}
                    onPointerUp={handleElementPointerUp}
                    style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height }}
                    onDragOver={handleDragOver}
                    onDrop={(e: any) => handleDropFromList(e, postoId)}
                    className={`group transition-none ${isEditMode ? 'z-[40] hover:z-[60]' : 'z-10 hover:z-[60]'} ${selectionClasses} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-sm' : ''}`}
                  >
                    {!isEditMode && postoId !== 'NOVO' && (
                      <div 
                        className="absolute bottom-full left-[50%] mb-2.5 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] ring-1 ring-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center p-3 z-50 origin-bottom"
                        style={{ transform: `translateX(-50%)` }}
                      >
                        {occupants.length > 0 && !isVacant ? (
                          <div className="flex flex-col gap-3 w-full max-h-60 overflow-y-auto custom-scrollbar">
                            {occupants.map(occ => (
                                <div key={occ.id} className="flex flex-col items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                                    {occ.foto_url || occ.photo_url ? (
                                      <img src={occ.foto_url || occ.photo_url} alt={occ.name} className="w-10 h-10 rounded-full object-cover shadow-sm mb-1.5 border-2 border-white" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1.5 shadow-sm border border-gray-200">
                                        <User className="w-4 h-4 text-gray-400" />
                                      </div>
                                    )}
                                    <p className="text-[10px] font-bold text-gray-800 text-center leading-tight mb-0.5">{occ.name}</p>
                                    <p className="text-[8px] font-medium text-gray-500 text-center uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-gray-200">{occ.roles?.name || occ.role}</p>
                                </div>
                            ))}
                          </div>
                        ) : isVacant ? (
                          <>
                            <MapPin className="w-8 h-8 text-amber-300 mb-2" />
                            <p className="text-xs font-bold text-amber-600 text-center uppercase mb-1">Mesa Inativa</p>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-8 h-8 text-gray-200 mb-2" />
                            <p className="text-xs font-bold text-gray-400 text-center uppercase mb-1">{isRotativo ? 'Rotativo Seco' : 'Posto Livre'}</p>
                          </>
                        )}
                        <div className="w-full h-px bg-gray-100 my-2"></div>
                        <p className="text-[10px] font-black text-[#1e3a8a] uppercase">{postoId} • {seatType}</p>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45"></div>
                      </div>
                    )}
      
                    {/* Visual UI Otimizada: Circular Avatar Based */}
                    <div className="flex flex-col items-center justify-center w-max p-1 group">
                      
                      {/* Avatar Render */}
                      <div className={`relative mb-1 rounded-full border-4 shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-all flex items-center justify-center bg-white ${
                        isVacant ? 'border-amber-300 ring-2 ring-transparent group-hover:ring-amber-200' :
                        occupants.length > 0 ? 'border-white ring-2 ring-gray-200 group-hover:ring-blue-300' :
                        'border-dashed border-gray-300'
                      }`} style={{ width: 56, height: 56 }}>
                          
                          {isVacant ? (
                              <div className="bg-amber-50 w-full h-full rounded-full flex items-center justify-center">
                                  <MapPin className="w-5 h-5 text-amber-400" />
                              </div>
                          ) : occupants.length > 0 ? (
                              <>
                                {/* Rendering first occupant's photo. Handle multiple occupants natively in badge/tooltip */}
                                {occupants[0].foto_url || occupants[0].photo_url ? (
                                    <img src={occupants[0].foto_url || occupants[0].photo_url} className="w-full h-full rounded-full object-cover" alt="" />
                                ) : (
                                    <div className="bg-blue-50 w-full h-full rounded-full flex items-center justify-center">
                                        <User className="w-7 h-7 text-blue-300/80" />
                                    </div>
                                )}
                                
                                {/* Badge count if there is more than 1 in the seat */}
                                {occupants.length > 1 && (
                                    <div className="absolute -top-1 -right-2 bg-green-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow shadow-black/20 z-20">
                                        +{occupants.length - 1}
                                    </div>
                                )}

                                {!isEditMode && occupants.length === 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveSeat(String(occupants[0].id));
                                      }}
                                      className="absolute -bottom-1 -right-2 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center cursor-pointer shadow-md hover:bg-red-600 border border-white transition-colors z-[60]"
                                      title="Remover ocupante"
                                    >
                                      <span className="text-[12px] leading-none mb-0.5 ml-[0.5px] font-bold">x</span>
                                    </button>
                                )}
                              </>
                          ) : (
                              <div className="bg-gray-50/80 w-full h-full rounded-full flex items-center justify-center">
                                  <span className="text-[8px] font-black text-gray-400 rotate-[-15deg]">LIVRE</span>
                              </div>
                          )}

                          {/* ID do Posto flutuante embaixo do avatar, como um label aderente */}
                          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full uppercase shadow-md flex items-center justify-center z-20 whitespace-nowrap border-2 border-white ${
                              (seatType.includes('ADM') || seatType.includes('ADMINISTRATIVO')) ? 'bg-orange-600 outline outline-1 outline-orange-600/30' : 'bg-[#1e3a8a] outline outline-1 outline-blue-900/30'
                          }`}>
                            <span className="text-[10px] font-black text-white leading-none tracking-widest px-0.5">
                              {postoId}
                            </span>
                          </div>
                      </div>

                      {/* Nome do Ocupante Embaixo (First + Initial) */}
                      <div className="mt-3 flex flex-col items-center justify-center">
                          {occupants.length > 0 ? (
                               <>
                                   <span className="block text-sm font-black text-[#1e3a8a] text-center leading-[1] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] max-w-[100px] truncate">
                                      {(() => {
                                         const parts = occupants[0].name.split(' ');
                                         let finalName = parts[0];
                                         if (parts.length > 1 && finalName.length <= 8) {
                                           finalName += ` ${parts[parts.length-1].charAt(0)}.`;
                                         }
                                         return finalName;
                                      })()}
                                   </span>
                                   <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest text-center mt-1">
                                     {(() => {
                                        const roleStr = occupants[0].roles?.name || occupants[0].role || '';
                                        const cleanRole = roleStr.toLowerCase().replace('advogada', '').replace('advogado', '').trim();
                                        return cleanRole || seatType;
                                     })()}
                                   </span>
                               </>
                          ) : isVacant ? (
                                <span className="block text-xs font-black text-amber-600 uppercase tracking-widest text-center">VAGO</span>
                          ) : (
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest text-center">{isRotativo ? 'ROTATIVO' : 'LIVRE'}</span>
                          )}
                      </div>
                      
                      {occupants.length === 1 && !isEditMode && (
                        <div 
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('colabId', String(occupants[0].id));
                           }}
                          onDoubleClick={() => onRemoveSeat(String(occupants[0].id))}
                          className="absolute inset-0 cursor-grab active:cursor-grabbing pointer-events-auto border border-transparent group-hover:border-blue-500/30"
                          title="Arraste de volta para a lista ou use o botão X"
                          style={{ zIndex: 10 }}
                        />
                      )}
                    </div>
                  </div>
                );
            }

            return null;
          })}

          {/* DRAG PREVIEW GHOST */}
          {drawingPath && (
              <div 
                  className="absolute pointer-events-none ring-2 ring-blue-500 bg-blue-500/20 z-50 transition-none"
                  style={{
                      left: Math.min(drawingPath.startX, drawingPath.curX),
                      top: Math.min(drawingPath.startY, drawingPath.curY),
                      width: Math.abs(drawingPath.curX - drawingPath.startX),
                      height: Math.abs(drawingPath.curY - drawingPath.startY)
                  }}
              />
          )}

          {/* Fallback caso não haja NADA no modo edição ainda */}
          {elements.length === 0 && isEditMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-70 pointer-events-none">
              <Users className="w-20 h-20 text-[#1e3a8a] mb-4 opacity-50" />
              <p className="text-xl font-black text-[#1e3a8a]">MAPEAMENTO VAZIO</p>
              <p className="text-sm font-bold text-gray-600 mt-2">Clique em Adicionar Posto para começar a popular a planta.</p>
            </div>
          )}

          {/* DRAG HANDLE FOR MAP RESIZE */}
          {isEditMode && activeTool === 'select' && (
              <div 
                  className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-[500] hover:bg-black/5 rounded-tl-xl flex items-end justify-end p-1.5"
                  onPointerDown={handleMapResizePointerDown}
                  onPointerMove={handleMapResizePointerMove}
                  onPointerUp={handleMapResizePointerUp}
                  title="Arrastar para Redimensionar Tamanho do Mapa"
              >
                  <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 pointer-events-none" />
              </div>
          )}

        </div>
      </div>
    </div>
  );
}
