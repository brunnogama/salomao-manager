import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Collaborator } from '../../../types/controladoria';
import { User, MapPin, MousePointer2, Square, Minus, Users, Trash2, Save, DoorOpen, GripVertical, Copy, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';

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
const MAP_W = 2550;
const MAP_H = 1500;

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
  const [activeTool, setActiveTool] = useState<'select' | 'wall' | 'line' | 'seat' | 'text' | 'door'>('select');
  const [zoomScale, setZoomScale] = useState(1.15);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [drawingPath, setDrawingPath] = useState<{startX: number, startY: number, curX: number, curY: number} | null>(null);
  const [movingElement, setMovingElement] = useState<{ id: string, startX: number, startY: number, elX: number, elY: number } | null>(null);
  const [clipboard, setClipboard] = useState<MapElement | null>(null);

  // Sync props -> state on load if not editing
  useEffect(() => {
    if (!unsavedChanges) {
      setElements(mapElements || []);
    }
  }, [mapElements, unsavedChanges]);

  // Keyboard Shortcuts (Copy & Paste & Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isEditMode) return;
        
        // Ignore se estiver digitando em input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            if (selectedId) {
                const el = elements.find(el => el.id === selectedId);
                if (el) setClipboard(el);
            }
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
            if (clipboard) {
                const newEl: MapElement = {
                    ...clipboard,
                    id: crypto.randomUUID(),
                    x: clipboard.x + 20,
                    y: clipboard.y + 20,
                    custom_data: clipboard.type === 'seat' ? { ...clipboard.custom_data, postoId: 'NOVO' } : { ...clipboard.custom_data }
                };
                setElements(prev => [...prev, newEl]);
                setSelectedId(newEl.id);
                setClipboard(newEl); // atualiza para que o próximo paste ande mais 20px
                setUnsavedChanges(true);
            }
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedId) {
                setElements(prev => prev.filter(el => el.id !== selectedId));
                setSelectedId(null);
                setUnsavedChanges(true);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, selectedId, elements, clipboard]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    
    // Se clicou com botão direito não desenha
    if (e.button !== 0) return;

    if (activeTool === 'select') {
        setSelectedId(null);
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
    if (!drawingPath) return;

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoomScale;
    const curX = (e.clientX - rect.left) / scale;
    const curY = (e.clientY - rect.top) / scale;

    setDrawingPath(prev => prev ? { ...prev, curX, curY } : null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingPath) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const dx = Math.abs(drawingPath.curX - drawingPath.startX);
    const dy = Math.abs(drawingPath.curY - drawingPath.startY);

    let finalX, finalY, finalW, finalH;

    // Se arraste foi pequeno (menos de 10px), considera clique simples para soltar padrão
    if (dx < 10 && dy < 10) {
        finalX = drawingPath.startX;
        finalY = drawingPath.startY;
        finalW = activeTool === 'wall' ? 100 : (activeTool === 'line' ? 200 : (activeTool === 'seat' ? W_STD : (activeTool === 'door' ? 40 : 100)));
        finalH = activeTool === 'wall' ? 100 : (activeTool === 'line' ? 2 : (activeTool === 'seat' ? H_STD : (activeTool === 'door' ? 5 : 30)));
    } else {
        // Usa as dimensões arrastadas livremente
        finalX = Math.min(drawingPath.startX, drawingPath.curX);
        finalY = Math.min(drawingPath.startY, drawingPath.curY);
        finalW = dx;
        finalH = dy;
        
        // Mesa não fica distorcida num retângulo gigante, mesa tem limite
        if (activeTool === 'seat') {
            finalW = W_STD;
            finalH = H_STD;
        }
    }

    const newEl: MapElement = {
        id: crypto.randomUUID(),
        type: activeTool as MapElement['type'],
        x: Math.round(finalX),
        y: Math.round(finalY),
        width: Math.round(finalW),
        height: Math.round(finalH),
        custom_data: activeTool === 'seat' ? { postoId: 'NOVO', seatType: 'PLENO' } : (activeTool === 'text' ? { textValue: 'Rótulo' } : {})
    };

    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
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
    setSelectedId(el.id);

    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoomScale;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    setMovingElement({ id: el.id, startX: clickX, startY: clickY, elX: el.x, elY: el.y });
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

    updateElement(movingElement.id, { x: Math.round(movingElement.elX + dx), y: Math.round(movingElement.elY + dy) });
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
      const newW = Math.max(10, Math.round((resizingElement.startW + deltaX) / 10) * 10);
      const newH = Math.max(10, Math.round((resizingElement.startH + deltaY) / 10) * 10);
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

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedId) return;
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
      setUnsavedChanges(true);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedId) return;
      const el = elements.find(item => item.id === selectedId);
      if (!el) return;

      const newEl: MapElement = {
          ...el,
          id: crypto.randomUUID(),
          x: el.x + 20,
          y: el.y + 20,
          custom_data: el.type === 'seat' ? { ...el.custom_data, postoId: 'NOVO' } : { ...el.custom_data }
      };
      setElements(prev => [...prev, newEl]);
      setSelectedId(newEl.id);
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
    const map = new Map<string, Collaborator>();
    collaborators.forEach(c => {
      if (c.posto) map.set(c.posto.toUpperCase(), c);
    });
    return map;
  }, [collaborators]);

  const getShortRole = (role: string) => {
    const rawData = role || '';
    if (!rawData.toLowerCase().includes('advogad')) {
       return rawData.split(' ')[0];
    }
    const r = rawData.toLowerCase().replace('advogado', '').replace('advogada', '').trim();
    if (!r) return '';
    return r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const selectedEl = elements.find(el => el.id === selectedId);

  return (
    <div 
      ref={containerRef}
      className={`w-full relative bg-gray-50 border border-gray-200 rounded-lg shadow-inner overflow-auto custom-scrollbar transition-all ${isEditMode ? 'ring-4 ring-blue-500/30 min-h-[70vh]' : 'min-h-[500px] h-[80vh]'}`}
    >
      {/* STUDIO TOOLBAR */}
      {isEditMode && (
        <div className="sticky top-4 left-4 z-50 pointer-events-none self-start h-0">
          <motion.div drag dragMomentum={false} className="flex flex-col gap-2 pointer-events-auto items-start">
            {/* Main Tools Container */}
            <div className="bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/10 border border-blue-100 flex items-center gap-1.5 cursor-move">
                {/* DRAG HANDLE */}
                <div className="p-1 px-1.5 text-gray-400 hover:text-gray-600 active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-px h-8 bg-gray-100 mr-1"></div>

                {/* TOOL: SELECT */}
                <button onClick={(e) => { e.stopPropagation(); setActiveTool('select'); }} className={`p-2.5 rounded-xl transition-all ${activeTool === 'select' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`} title="Selecionar / Mover">
                    <MousePointer2 className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-gray-100 mx-1"></div>

                {/* TOOL: WALL */}
                <button onClick={() => setActiveTool('wall')} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${activeTool === 'wall' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Square className="w-5 h-5" /> <span className="text-xs uppercase tracking-wide pr-1">Sala</span>
                </button>

                {/* TOOL: LINE */}
                <button onClick={() => setActiveTool('line')} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${activeTool === 'line' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Minus className="w-5 h-5" /> <span className="text-xs uppercase tracking-wide pr-1">Linha</span>
                </button>

                {/* TOOL: DOOR */}
                <button onClick={() => setActiveTool('door')} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${activeTool === 'door' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <DoorOpen className="w-5 h-5" /> <span className="text-xs uppercase tracking-wide pr-1">Porta</span>
                </button>

                {/* TOOL: SEAT */}
                <button onClick={() => setActiveTool('seat')} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${activeTool === 'seat' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Users className="w-5 h-5" /> <span className="text-xs uppercase tracking-wide pr-1">Posto</span>
                </button>

                {/* TOOL: TEXT */}
                <button onClick={() => setActiveTool('text')} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${activeTool === 'text' ? 'bg-amber-100 text-amber-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Type className="w-5 h-5" /> <span className="text-xs uppercase tracking-wide pr-1">Texto</span>
                </button>

                <div className="w-px h-8 bg-gray-100 mx-1"></div>

                {/* ACTION: SAVE */}
                <button onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={!unsavedChanges} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${unsavedChanges ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <Save className="w-5 h-5" /> <span className="text-xs uppercase tracking-wide font-black">Salvar Mapa</span>
                </button>
            </div>

            {/* SELECTION PROPERTIES INSPECTOR */}
            {selectedEl && activeTool === 'select' && (
                <div className="bg-white p-3 pt-4 rounded-2xl shadow-xl shadow-black/10 border border-gray-200 w-64 pointer-events-auto mt-2 animate-in slide-in-from-left-4 fade-in duration-200">
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

                    {/* Generics: W / H */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Largura (px)</label>
                            <input type="number" value={selectedEl.width} onChange={e => updateElement(selectedId!, { width: parseInt(e.target.value) || 10 })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Altura (px)</label>
                            <input type="number" value={selectedEl.height} onChange={e => updateElement(selectedId!, { height: parseInt(e.target.value) || 10 })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                    </div>

                    {/* Specifics: Seat Fields */}
                    {selectedEl.type === 'seat' && (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-indigo-500">ID do Posto (Ex: S01)</label>
                                <input type="text" value={selectedEl.custom_data?.postoId || ''} onChange={e => updateElement(selectedId!, { custom_data: { ...selectedEl.custom_data, postoId: e.target.value.toUpperCase() } })} className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm font-black text-indigo-900 bg-indigo-50 focus:outline-none focus:bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-gray-400">Tipo / Hierarquia</label>
                                <select 
                                    value={selectedEl.custom_data?.seatType || 'PLENO'} 
                                    onChange={e => updateElement(selectedId!, { custom_data: { ...selectedEl.custom_data, seatType: e.target.value } })}
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
                        </div>
                    )}

                    {/* Specifics: Text Fields */}
                    {selectedEl.type === 'text' && (
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500">Conteúdo do Texto</label>
                                <input type="text" value={selectedEl.custom_data?.textValue || ''} onChange={e => updateElement(selectedId!, { custom_data: { ...selectedEl.custom_data, textValue: e.target.value } })} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-black text-gray-800 focus:outline-none focus:bg-white" />
                            </div>
                        </div>
                    )}
                </div>
            )}
          </motion.div>
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
      </div>

      {/* Wrapper de Escala para Garantir Legibilidade Preservando a Matemática Base */}
      <div className="mx-auto" style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center', padding: '20px 0', width: MAP_W * zoomScale, height: MAP_H * zoomScale, flexShrink: 0, transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), width 0.2s cubic-bezier(0.2, 0, 0, 1), height 0.2s cubic-bezier(0.2, 0, 0, 1)' }}>
        <div 
          ref={contentRef}
          id="mapa-31-andar-content"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative bg-white select-none rounded-xl shadow-sm ring-1 ring-gray-200 mx-auto ${activeTool !== 'select' && isEditMode ? 'cursor-crosshair bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]' : ''}`}
          style={{ width: MAP_W, height: MAP_H, overflow: 'hidden' }}
        >
          {elements.map(el => {
              
            const isSelected = selectedId === el.id;
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
                        className={`flex items-center justify-center transition-none bg-transparent ${selectionClasses} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 rounded-sm' : ''} ${isEditMode ? 'border border-dashed border-gray-200' : ''}`}
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
                const occupant = seatsMap.get(postoId.toUpperCase());

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    onPointerMove={handleElementPointerMove}
                    onPointerUp={handleElementPointerUp}
                    style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: isEditMode ? 40 : 10 }}
                    onDragOver={handleDragOver}
                    onDrop={(e: any) => handleDropFromList(e, postoId)}
                    className={`group transition-none ${selectionClasses} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-sm' : ''}`}
                  >
                    {!isEditMode && postoId !== 'NOVO' && (
                      <div 
                        className="absolute bottom-full left-[50%] mb-2.5 w-48 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 ring-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center p-3 z-50 origin-bottom"
                        style={{ transform: `translateX(-50%)` }}
                      >
                        {occupant ? (
                          <>
                            {occupant.foto_url || occupant.photo_url ? (
                              <img src={occupant.foto_url || occupant.photo_url} alt={occupant.name} className="w-12 h-12 rounded-full object-cover shadow-sm mb-2 border-2 border-gray-100" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 shadow-sm">
                                <User className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <p className="text-xs font-bold text-gray-800 text-center leading-tight mb-1">{occupant.name}</p>
                            <p className="text-[9px] font-medium text-gray-500 text-center uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">{occupant.roles?.name || occupant.role}</p>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-8 h-8 text-gray-200 mb-2" />
                            <p className="text-xs font-bold text-gray-400 text-center uppercase">Posto Livre</p>
                          </>
                        )}
                        <div className="w-full h-px bg-gray-100 my-2"></div>
                        <p className="text-[10px] font-black text-[#1e3a8a] uppercase">{postoId} • {seatType}</p>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
                      </div>
                    )}
      
                    {/* BADGE DE IDENTIFICAÇÃO DO POSTO (COM COR DO CARGO) */}
                    {postoId !== 'NOVO' && (
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-[2px] rounded uppercase shadow-sm border border-black/10 flex items-center justify-center z-20 ${
                            (seatType.includes('ADM') || seatType.includes('ADMINISTRATIVO')) ? 'bg-orange-600' : 'bg-[#1e3a8a]'
                        }`}>
                           <span className="text-[6.5px] font-black text-white leading-none tracking-wider">
                             {postoId}
                           </span>
                        </div>
                    )}

                    {/* Visual UI (Transparent / Borderless) */}
                    <div className="flex flex-col flex-nowrap items-center pt-1.5 justify-start w-full h-full p-[1px] bg-transparent transition-colors overflow-visible relative group-hover:bg-[#1e3a8a]/5">
                      {occupant ? (
                        <>
                          {!isEditMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSeat(String(occupant.id));
                              }}
                              className="absolute -top-[5px] -right-[5px] w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center cursor-pointer shadow-md hover:bg-red-600 border border-white transition-colors z-[60]"
                              title="Remover e colocar Sem Posto"
                            >
                              <span className="text-[10px] leading-none mb-0.5 ml-[1px] font-bold">x</span>
                            </button>
                          )}
      
                          <div className="w-[24px] h-[24px] rounded-full overflow-hidden shrink-0 shadow-md border border-gray-200 bg-white flex items-center justify-center relative z-10">
                            {occupant.foto_url || occupant.photo_url ? (
                              <img src={occupant.foto_url || occupant.photo_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex flex-col items-center mt-0.5 absolute top-[30px] w-[150%] -left-[25%] pointer-events-none z-20">
                              <span className="block text-[7px] font-bold text-gray-800 text-center leading-[1.1] bg-white/80 px-0.5 rounded-sm drop-shadow-sm">
                                {(() => {
                                   const parts = occupant.name.split(' ');
                                   let finalName = parts[0];
                                   if (parts.length > 1 && finalName.length <= 8) {
                                     finalName += ` ${parts[parts.length-1].charAt(0)}.`;
                                   }
                                   return finalName;
                                })()}
                              </span>
                              <span className="block text-[6px] font-black text-[#1e3a8a] uppercase mt-[1px] text-center leading-none bg-white/80 px-0.5 rounded-sm drop-shadow-sm">
                                {getShortRole(occupant.roles?.name || occupant.role || '')}
                              </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full pb-2 opacity-50">
                          {isEditMode ? (
                              <span className="block text-[10px] font-black leading-none text-gray-400">
                                {postoId}
                              </span>
                          ) : (
                              <>
                                  <MapPin className="w-3.5 h-3.5 text-gray-400 drop-shadow-sm mb-0.5" />
                                  <span className="text-[5.5px] font-bold text-gray-500 uppercase tracking-widest text-center leading-none">
                                    {seatType}
                                  </span>
                              </>
                          )}
                        </div>
                      )}
                      
                      {occupant && !isEditMode && (
                        <div 
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('colabId', String(occupant.id));
                           }}
                          onDoubleClick={() => onRemoveSeat(String(occupant.id))}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
              <Square className="w-20 h-20 text-gray-400 mb-4" />
              <p className="text-xl font-black text-gray-500">CANVAS LIMPO</p>
              <p className="text-sm font-bold text-gray-400 mt-2">Use as ferramentas para começar a desenhar as salas e linhas.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
