import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Collaborator } from '../../../types/controladoria';
import { User, MapPin, MousePointer2, Square, Minus, Users, Trash2, Save, DoorOpen, GripVertical } from 'lucide-react';
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
const MAP_W = 1700;
const MAP_H = 1000;

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Sync props -> state on load if not editing
  useEffect(() => {
    if (!unsavedChanges) {
      setElements(mapElements || []);
    }
  }, [mapElements, unsavedChanges]);

  // Click handler to draw elements
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    
    // Convert click coordinates to relative position inside the scaled map
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;

    // We take into account the 1.15 scale defined on the wrapper
    const scale = 1.15;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    // Only drop if we are using a drawing tool
    if (activeTool === 'select') {
        setSelectedId(null);
        return;
    }

    const newEl: MapElement = {
        id: crypto.randomUUID(),
        type: activeTool,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: activeTool === 'wall' ? 100 : (activeTool === 'line' ? 200 : (activeTool === 'seat' ? W_STD : (activeTool === 'door' ? 40 : 100))),
        height: activeTool === 'wall' ? 100 : (activeTool === 'line' ? 2 : (activeTool === 'seat' ? H_STD : (activeTool === 'door' ? 5 : 30))),
        custom_data: activeTool === 'seat' ? { postoId: 'NOVO', seatType: 'PLENO' } : (activeTool === 'text' ? { textValue: 'Rótulo' } : {})
    }

    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    setActiveTool('select');
    setUnsavedChanges(true);
  };

  const updateElement = (id: string, updates: Partial<MapElement>) => {
      setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
      setUnsavedChanges(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, el: MapElement) => {
    if (!isEditMode) return;
    const finalLeft = Math.round(el.x + (info.offset.x / 1.15));
    const finalTop = Math.round(el.y + (info.offset.y / 1.15));
    if (el.x === finalLeft && el.y === finalTop) return; // Prevent unnecessary updates
    updateElement(el.id, { x: finalLeft, y: finalTop });
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedId) return;
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
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
    const colabId = e.dataTransfer.getData('colabId');
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
    return r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Advogado';
  };

  const selectedEl = elements.find(el => el.id === selectedId);

  return (
    <div 
      ref={containerRef}
      className={`w-full relative flex justify-center items-start bg-gray-50 border border-gray-200 rounded-lg shadow-inner overflow-auto custom-scrollbar transition-all ${isEditMode ? 'ring-4 ring-blue-500/30 min-h-[70vh]' : 'min-h-[500px] h-[80vh]'}`}
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
                        <button onClick={handleDelete} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
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
                </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Wrapper de Escala para Garantir Legibilidade Preservando a Matemática Base */}
      <div style={{ transform: 'scale(1.15)', transformOrigin: 'top center', padding: '20px 0', width: MAP_W * 1.15, height: MAP_H * 1.15, flexShrink: 0 }}>
        <div 
          ref={contentRef}
          id="mapa-31-andar-content"
          onClick={handleCanvasClick}
          className={`relative bg-white select-none rounded-xl shadow-sm ring-1 ring-gray-200 mx-auto ${activeTool !== 'select' && isEditMode ? 'cursor-crosshair bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]' : ''}`}
          style={{ width: MAP_W, height: MAP_H, overflow: 'hidden' }}
        >
          {elements.map(el => {
              
            const isSelected = selectedId === el.id;
            const selectionClasses = isSelected && isEditMode ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : '';

            // RENDER WALL
            if (el.type === 'wall') {
                return (
                    <motion.div
                        key={el.id}
                        drag={isEditMode && activeTool === 'select'}
                        dragMomentum={false}
                        onDragEnd={(e, info) => handleDragEnd(e, info, el)}
                        onClick={(e) => { e.stopPropagation(); if (activeTool==='select') setSelectedId(el.id); }}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, x: 0, y: 0 }}
                        className={`border-2 border-gray-800 bg-gray-50/50 ${selectionClasses}`}
                    />
                );
            }

            // RENDER LINE
            if (el.type === 'line') {
                return (
                    <motion.div
                        key={el.id}
                        drag={isEditMode && activeTool === 'select'}
                        dragMomentum={false}
                        onDragEnd={(e, info) => handleDragEnd(e, info, el)}
                        onClick={(e) => { e.stopPropagation(); if (activeTool==='select') setSelectedId(el.id); }}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, x: 0, y: 0 }}
                        className={`bg-gray-800 ${selectionClasses} ${isSelected ? 'h-[4px] -my-[1px]' : ''}`}
                    />
                );
            }

            // RENDER DOOR
            if (el.type === 'door') {
                return (
                    <motion.div
                        key={el.id}
                        drag={isEditMode && activeTool === 'select'}
                        dragMomentum={false}
                        onDragEnd={(e, info) => handleDragEnd(e, info, el)}
                        onClick={(e) => { e.stopPropagation(); if (activeTool==='select') setSelectedId(el.id); }}
                        style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, x: 0, y: 0, zIndex: 15 }}
                        className={`bg-white border text-[0px] ${selectionClasses ? selectionClasses : 'border-dashed border-gray-400 hover:border-gray-500'}`}
                    />
                );
            }

            // RENDER SEAT
            if (el.type === 'seat') {
                const postoId = el.custom_data?.postoId || 'NOVO';
                const seatType = el.custom_data?.seatType || 'PLENO';
                const occupant = seatsMap.get(postoId.toUpperCase());

                return (
                  <motion.div
                    key={el.id}
                    drag={isEditMode && activeTool === 'select'}
                    dragMomentum={false}
                    onDragEnd={(e, info) => handleDragEnd(e, info, el)}
                    onClick={(e) => { e.stopPropagation(); if (activeTool==='select') setSelectedId(el.id); }}
                    style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: isEditMode ? 40 : 10, x: 0, y: 0 }}
                    onDragOver={handleDragOver}
                    onDrop={(e: any) => handleDropFromList(e, postoId)}
                    className={`group ${selectionClasses} ${isEditMode && activeTool === 'select' ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-sm' : ''}`}
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
      
                    {/* Visual UI (Compact Black-Border Exact Representation) */}
                    <div className="flex flex-col flex-nowrap items-center pt-0.5 justify-start w-full h-full p-[1px] border border-black bg-white group-hover:bg-[#1e3a8a]/5 transition-colors overflow-hidden">
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
      
                          <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0 shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center">
                            {occupant.foto_url || occupant.photo_url ? (
                              <img src={occupant.foto_url || occupant.photo_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <span className="block text-[7.5px] mt-0.5 font-bold text-gray-900 text-center leading-[1.1] w-full truncate px-0.5 shrink-0">
                            {(() => {
                               const parts = occupant.name.split(' ');
                               let finalName = parts[0];
                               if (parts.length > 1 && finalName.length <= 8) {
                                 finalName += ` ${parts[parts.length-1].charAt(0)}.`;
                               }
                               return finalName;
                            })()}
                          </span>
                          <span className="block text-[5.5px] font-medium text-gray-500 uppercase mt-[1px] w-full text-center truncate px-0.5 shrink-0">
                            {getShortRole(occupant.roles?.name || occupant.role || '')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={`block text-[10px] mt-0.5 font-black leading-none mb-0.5 ${seatType.includes('ADMINISTRATIVO') || seatType.includes('ADM') ? 'text-purple-700' : seatType === 'SÊNIOR' || seatType === 'SÓCIO' ? 'text-red-600' : 'text-[#1e3a8a]'} opacity-70`}>
                            {postoId}
                          </span>
                          <span className={`block text-[6.5px] font-bold tracking-widest uppercase text-center w-full mt-0.5 leading-none opacity-60 ${seatType === 'SÓCIO' ? 'text-red-700' : seatType === 'SÊNIOR' ? 'text-red-600' : seatType === 'ESTAGIÁRIO' ? 'text-orange-600' : seatType === 'ADMINISTRATIVO' ? 'text-purple-700' : seatType === 'CONSULTOR' ? 'text-amber-600' : seatType === 'JÚNIOR' ? 'text-blue-600' : 'text-emerald-600'}`}>
                            {seatType}
                          </span>
                        </>
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
                  </motion.div>
                );
            }

            return null;
          })}

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
