import React, { useMemo, useRef } from 'react';
import { Collaborator } from '../../../types/controladoria';
import { User, MapPin } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';

interface FloorPlanProps {
  collaborators: Collaborator[];
  seatLayoutOverrides?: Record<string, { map_x: number, map_y: number }>;
  isEditMode?: boolean;
  onAssignSeat: (collaboratorId: string, seatId: string) => void;
  onRemoveSeat: (collaboratorId: string) => void;
  onUpdateSeatCoordinates?: (seatId: string, map_x: number, map_y: number) => void;
}

interface SeatDef {
  id: string;
  type: string;
  left: number; // pixels
  top: number; //  pixels
  width: number; // pixels
  height: number; // pixels
}

const W_STD = 75;
const H_STD = 40;
const MAP_W = 1700;
const MAP_H = 1000;

function generateBlock(prefix: string, type: string, count: number, startId: number, startX: number, startY: number, cols: number = 2, rows: number = 4, gapX: number = 20) {
  return Array.from({length: count}).map((_, i) => {
    const idNum = startId + i;
    const itemsPerBlock = cols * rows; 
    const block = Math.floor(i / itemsPerBlock);
    const inBlock = i % itemsPerBlock;
    
    // COLUMN-MAJOR
    const col = Math.floor(inBlock / rows);
    const row = inBlock % rows;
    
    return {
      id: `${prefix}${String(idNum).padStart(2,'0')}`, type,
      left: startX + block * (cols * W_STD + gapX) + col * W_STD,
      top: startY + row * H_STD,
      width: W_STD, height: H_STD
    };
  });
}

const SEATS_31_ANDAR: SeatDef[] = [
  // S01-S15 (5 salas x 3 postos)
  ...Array.from({length: 15}).map((_, i) => {
    const idNum = i + 1;
    const room = Math.floor(i / 3);
    const pos = i % 3; // 0=Top-Left, 1=Bottom-Left, 2=Right
    return {
      id: `S${String(idNum).padStart(2,'0')}`, type: 'SÊNIOR',
      left: pos === 2 ? 80 : 20, 
      top: 40 + room * 130 + (pos === 0 ? 0 : pos === 1 ? 55 : 30), 
      width: 60, height: 45
    };
  }),

  // J01-J12 Left Corridor
  ...Array.from({length: 12}).map((_, i) => {
    const idNum = i + 1; 
    const isOdd = idNum % 2 !== 0; 
    const col = isOdd ? 1 : 0;
    const row = Math.floor((idNum - 1) / 2); 
    return {
      id: `J${String(idNum).padStart(2,'0')}`, type: 'JÚNIOR',
      left: 20 + col * W_STD, top: 720 + row * H_STD, width: W_STD, height: H_STD
    };
  }),

  { id: 'SC01', type: 'SÓCIO', left: 180, top: 40, width: 90, height: 60 },

  // Blocos Centrais (Column Major)
  ...generateBlock('J', 'JÚNIOR', 16, 13, 220, 680, 2, 4, 30),
  ...generateBlock('E', 'ESTAGIÁRIO', 40, 1, 220 + (2 * W_STD + 30) * 2, 680, 2, 4, 10), // E01-E40 juntos com gap 10
  ...generateBlock('J', 'JÚNIOR', 16, 29, 220 + (2 * W_STD + 30) * 2 + (10 * W_STD + 10 * 4) + 20, 680, 2, 4, 30),

  // Plenos (P01-P24)
  // 3 blocos de 8 posições. Pares em cima, Ímpares embaixo.
  ...Array.from({length: 24}).map((_, i) => {
    const idNum = i + 1;
    const block = Math.floor((idNum - 1) / 8);
    const colDentroDoBloco = Math.floor((idNum - 1) / 2) % 4;
    const isTopRow = (idNum % 2 === 0);
    const row = isTopRow ? 0 : 1;
    
    return {
      id: `P${String(idNum).padStart(2,'0')}`, type: 'PLENO',
      left: 220 + block * (4 * W_STD + 30) + colDentroDoBloco * W_STD, 
      top: 880 + row * H_STD, 
      width: W_STD, height: H_STD
    }
  }),

  // A01-A22 (Coluna Direita, com GAP reduzido de 400px)
  ...Array.from({length: 22}).map((_, i) => {
    const idNum = i + 1;
    const isOdd = idNum % 2 !== 0; 
    const col = isOdd ? 0 : 1;
    const row = 10 - Math.floor((idNum - 1) / 2); 
    return {
      id: `A${String(idNum).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
      left: 1480 + col * W_STD, 
      top: 540 + row * H_STD, 
      width: W_STD, height: H_STD
    }
  }),

  // S16-S18 Encartados (Shift 400px pra esq)
  { id: 'S16', type: 'SÊNIOR', left: 1140, top: 40, width: W_STD + 15, height: 60 },
  { id: 'S17', type: 'SÊNIOR', left: 1140, top: 120, width: W_STD + 15, height: 60 },
  { id: 'S18', type: 'SÊNIOR', left: 1240, top: 120, width: W_STD + 15, height: 60 },

  // Corredor Direito (Shift 400px)
  { id: 'CONS01',   type: 'CONSULTOR', left: 1480, top: 40,  width: W_STD * 2, height: 60 },
  { id: 'SC02',     type: 'SÓCIO',     left: 1480, top: 110, width: W_STD * 2, height: 70 },
  { id: 'S19', type: 'SÊNIOR', left: 1480, top: 210, width: W_STD * 2, height: 60 },
  { id: 'S20', type: 'SÊNIOR', left: 1480, top: 280, width: W_STD * 2, height: 60 },
  { id: 'S21', type: 'SÊNIOR', left: 1480, top: 350, width: W_STD * 2, height: 60 },
];

export function RHMapaAndar31({ 
  collaborators, 
  seatLayoutOverrides = {},
  isEditMode = false,
  onAssignSeat, 
  onRemoveSeat,
  onUpdateSeatCoordinates
}: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropFromList = (e: React.DragEvent, seatId: string) => {
    e.preventDefault();
    if (isEditMode) return; 
    const colabId = e.dataTransfer.getData('colabId');
    if (colabId) {
      onAssignSeat(colabId, seatId);
    }
  };

  const handleSeatDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, seatId: string, baseLeft: number, baseTop: number) => {
    if (!isEditMode || !onUpdateSeatCoordinates) return;
    const finalLeft = Math.round(baseLeft + info.offset.x);
    const finalTop = Math.round(baseTop + info.offset.y);
    onUpdateSeatCoordinates(seatId, finalLeft, finalTop);
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

  return (
    <div 
      ref={containerRef}
      className={`w-full relative flex justify-center items-start bg-gray-50 border border-gray-200 rounded-lg shadow-inner overflow-auto custom-scrollbar transition-all ${isEditMode ? 'ring-4 ring-blue-500/30' : ''}`}
      style={{ minHeight: '500px', maxHeight: '80vh', touchAction: 'pan-x pan-y' }}
    >
      {isEditMode && (
        <div className="sticky top-4 left-4 z-50 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-2 pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Modo Design Ativo - Arraste as mesas para reposicionar
        </div>
      )}

      {/* Wrapper de Escala para Garantir Legibilidade Preservando a Matemática Base */}
      <div style={{ transform: 'scale(1.15)', transformOrigin: 'top center', padding: '20px 0', width: MAP_W * 1.15, height: MAP_H * 1.15, flexShrink: 0 }}>
        <div 
          id="mapa-31-andar-content"
          className="relative bg-white select-none rounded-xl shadow-sm ring-1 ring-gray-200 mx-auto"
          style={{ width: MAP_W, height: MAP_H }}
        >
          {/* Linhas Estruturais do CSS com 400px Shift na Direita */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Left Seniores Rooms */}
            {Array.from({length: 5}).map((_, i) => (
              <div key={`room-s-${i}`} className="absolute left-[15px] w-[140px] h-[130px] border border-black" style={{ top: `${35 + i * 130}px` }}></div>
            ))}
            
            {/* Decorative Rooms Extra */}
            <div className="absolute top-[800px] left-[15px] w-[140px] h-[50px] border border-black flex items-center justify-center">
               <span className="text-[12px] font-bold">Cell</span>
            </div>
            <div className="absolute top-[850px] left-[15px] w-[140px] h-[70px] border border-t-0 border-black flex items-center justify-center">
               <span className="text-[12px] font-bold text-center leading-tight">Banheiro<br/>Feminino</span>
            </div>
  
            <div className="absolute top-[880px] left-[1480px] w-[150px] h-[80px] border border-black flex items-center justify-center">
               <span className="text-[12px] font-bold text-center">Sala de Reunião 5</span>
            </div>
            <div className="absolute top-[880px] left-[1630px] w-[50px] h-[80px] border border-l-0 border-black flex items-center justify-center">
               <span className="text-[10px] font-bold text-center leading-tight rotate-90">Banheiro<br/>Masc</span>
            </div>
            
            {/* Right Consultant/Senior Rooms */}
            {/* Sala 1 e 2 independentes */}
            <div className="absolute left-[1480px] w-[150px] h-[70px] border border-black" style={{ top: '35px' }}></div>
            <div className="absolute left-[1480px] w-[150px] h-[80px] border border-black" style={{ top: '105px' }}></div>
            <div className="absolute left-[1630px] w-[50px] h-[150px] border border-black border-l-0" style={{ top: '35px' }}></div>
            
            {/* SALA UNIFICADA para S19, S20, S21 */}
            <div className="absolute left-[1480px] w-[150px] h-[240px] border border-black" style={{ top: '185px' }}></div>
  
            {/* Central Area Left */}
            <div className="absolute top-[35px] left-[165px] w-[750px] h-[1px] bg-black" />
            <div className="absolute top-[650px] left-[165px] w-[750px] h-[1px] bg-black" />
            <div className="absolute top-[35px] left-[165px] w-[1px] h-[615px] bg-black" />
            <div className="absolute top-[35px] left-[915px] w-[1px] h-[615px] bg-black" />
            
            {/* SC01 Walls inside Left Area */}
            <div className="absolute top-[120px] left-[165px] w-[120px] h-[1px] bg-black" />
            <div className="absolute top-[35px] left-[285px] w-[1px] h-[85px] bg-black" />
  
            {/* Central Area Right - Gap Shift Applied (-400X) */}
            <div className="absolute top-[35px] left-[550px] w-[810px] h-[1px] bg-black" />
            <div className="absolute top-[650px] left-[550px] w-[810px] h-[1px] bg-black" />
            <div className="absolute top-[35px] left-[550px] w-[1px] h-[615px] bg-black" />
            <div className="absolute top-[35px] left-[1360px] w-[1px] h-[615px] bg-black" />
            
            {/* S16-S18 Walls inside Right Area */}
            <div className="absolute top-[200px] left-[1130px] w-[230px] h-[1px] bg-black" />
            <div className="absolute top-[35px] left-[1130px] w-[1px] h-[165px] bg-black" />
            <div className="absolute top-[35px] left-[1220px] w-[1px] h-[165px] bg-black" />
          </div>
  
          {SEATS_31_ANDAR.map(seat => {
            const occupant = seatsMap.get(seat.id.toUpperCase());
            const overrideInfo = seatLayoutOverrides[seat.id];
            const currentLeft = overrideInfo ? overrideInfo.map_x : seat.left;
            const currentTop = overrideInfo ? overrideInfo.map_y : seat.top;
  
            return (
              <motion.div
                key={seat.id}
                drag={isEditMode}
                dragMomentum={false}
                onDragEnd={(e, info) => handleSeatDragEnd(e, info, seat.id, currentLeft, currentTop)}
                style={{
                  position: 'absolute',
                  left: currentLeft,
                  top: currentTop,
                  width: seat.width,
                  height: seat.height,
                  zIndex: isEditMode ? 40 : 10,
                  x: 0, 
                  y: 0 
                }}
                onDragOver={handleDragOver}
                onDrop={(e: any) => handleDropFromList(e, seat.id)}
                className={`group ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-sm bg-white/50 backdrop-blur-sm' : ''}`}
              >
                {/* Oculta o Tooltip no isEditMode */}
                {!isEditMode && (
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
                    <p className="text-[10px] font-black text-[#1e3a8a] uppercase">{seat.id} • {seat.type}</p>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
                  </div>
                )}
  
                {/* EXATA Fidelidade ao Desenho do Mapa c/ Botão X e Layout Compacto */}
                <div className="flex flex-col flex-nowrap items-center pt-0.5 justify-start w-full h-full p-[1px] border border-black bg-white group-hover:bg-[#1e3a8a]/5 transition-colors overflow-hidden">
                  
                  {occupant ? (
                    <>
                      {/* Botão X para retirar do posto */}
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
  
                      {/* Foto Reduzida Pura */}
                      <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0 shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center">
                        {occupant.foto_url || occupant.photo_url ? (
                          <img src={occupant.foto_url || occupant.photo_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <User className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Nome Abrev */}
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
                      
                      {/* Cargo bem leve */}
                      <span className="block text-[5.5px] font-medium text-gray-500 uppercase mt-[1px] w-full text-center truncate px-0.5 shrink-0">
                        {getShortRole(occupant.roles?.name || occupant.role || '')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={`block text-[10px] mt-0.5 font-black leading-none mb-0.5 ${seat.type.includes('ADMINISTRATIVO') || seat.type.includes('ADM') ? 'text-purple-700' : seat.type === 'SÊNIOR' || seat.type === 'SÓCIO' ? 'text-red-600' : 'text-[#1e3a8a]'} opacity-70`}>
                        {seat.id}
                      </span>
                      <span className={`block text-[6.5px] font-bold tracking-widest uppercase text-center w-full mt-0.5 leading-none opacity-60 ${seat.type === 'SÓCIO' ? 'text-red-700' : seat.type === 'SÊNIOR' ? 'text-red-600' : seat.type === 'ESTAGIÁRIO' ? 'text-orange-600' : seat.type === 'ADMINISTRATIVO' ? 'text-purple-700' : seat.type === 'CONSULTOR' ? 'text-amber-600' : seat.type === 'JÚNIOR' ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {seat.type}
                      </span>
                    </>
                  )}
                  
                  {/* Overlay HTML5 Drag para arrastar para fora - Evita Conflito com Botão X */}
                  {occupant && !isEditMode && (
                    <div 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('colabId', String(occupant.id));
                      }}
                      onDoubleClick={() => onRemoveSeat(String(occupant.id))}
                      className="absolute inset-0 cursor-grab active:cursor-grabbing pointer-events-auto border border-transparent group-hover:border-blue-500/30"
                      title="Arraste de volta para a lista ou use o botão X"
                      style={{ zIndex: 10 /* Abaixo do botão X */ }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
