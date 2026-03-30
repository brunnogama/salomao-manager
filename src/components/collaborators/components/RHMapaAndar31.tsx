import React, { useMemo, useRef, useState } from 'react';
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
  left: number; // pixels iniciais
  top: number; //  pixels iniciais
  width: number; // pixels iniciais
  height: number; // pixels iniciais
}

const W_STD = 75;
const H_STD = 40;
const MAP_W = 2100;
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

  // A01-A22 (Coluna Direita, descendo abaixo de S21)
  ...Array.from({length: 22}).map((_, i) => {
    const idNum = i + 1;
    const isOdd = idNum % 2 !== 0; 
    const col = isOdd ? 0 : 1;
    const row = 10 - Math.floor((idNum - 1) / 2); 
    return {
      id: `A${String(idNum).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
      left: 1880 + col * W_STD, 
      top: 540 + row * H_STD, 
      width: W_STD, height: H_STD
    }
  }),

  // S16-S18 Encartados
  { id: 'S16', type: 'SÊNIOR', left: 1540, top: 40, width: W_STD + 15, height: 60 },
  { id: 'S17', type: 'SÊNIOR', left: 1540, top: 120, width: W_STD + 15, height: 60 },
  { id: 'S18', type: 'SÊNIOR', left: 1640, top: 120, width: W_STD + 15, height: 60 },

  // Corredor Direito
  { id: 'CONS01',   type: 'CONSULTOR', left: 1880, top: 40,  width: W_STD * 2, height: 60 },
  { id: 'SC02',     type: 'SÓCIO',     left: 1880, top: 110, width: W_STD * 2, height: 70 },
  { id: 'S19', type: 'SÊNIOR', left: 1880, top: 210, width: W_STD * 2, height: 60 },
  { id: 'S20', type: 'SÊNIOR', left: 1880, top: 280, width: W_STD * 2, height: 60 },
  { id: 'S21', type: 'SÊNIOR', left: 1880, top: 350, width: W_STD * 2, height: 60 },
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
    if (isEditMode) return; // Impede drop de RH na edição de layout
    const colabId = e.dataTransfer.getData('colabId');
    if (colabId) {
      onAssignSeat(colabId, seatId);
    }
  };

  // Tratar soltar de cards do Framer Motion para salvar coordenadas
  const handleSeatDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, seatId: string, baseLeft: number, baseTop: number) => {
    if (!isEditMode || !onUpdateSeatCoordinates) return;
    
    // Calcular a posição final baseada no offset do drag
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

      {/* Container com a imagem de fundo da planta da arquitetura */}
      <div 
        id="mapa-31-andar-content"
        className="relative bg-white shrink-0 m-4 rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden"
        style={{ 
          width: MAP_W, 
          height: MAP_H, 
          // Troque "/mapa_base_31.png" pelo caminho correto da sua imagem (na pasta public/)
          backgroundImage: "url('/mapa_base_31.png')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        {/* Camada translúcida caso a imagem da planta não exista ou demore a carregar */}
        <div className="absolute inset-0 bg-white/70 pointer-events-none"></div>

        {SEATS_31_ANDAR.map(seat => {
          const occupant = seatsMap.get(seat.id.toUpperCase());

          // Checa se existe posição customizada no banco vinda do parent (local override)
          const overrideInfo = seatLayoutOverrides[seat.id];
          const currentLeft = overrideInfo ? overrideInfo.map_x : seat.left;
          const currentTop = overrideInfo ? overrideInfo.map_y : seat.top;

          return (
            <motion.div
              key={seat.id}
              drag={isEditMode}
              dragMomentum={false} // Para não deslizar após soltar
              onDragEnd={(e, info) => handleSeatDragEnd(e, info, seat.id, currentLeft, currentTop)}
              // Resetamos o transform do motion quando altera propriedades externas, 
              // forçando-o a pular diretamente pelo left/top CSS original
              style={{
                position: 'absolute',
                left: currentLeft,
                top: currentTop,
                width: occupant ? W_STD : 40,  // Mesa vazia fica menor
                height: occupant ? H_STD : 40, // Mesa vazia circular/menor
                zIndex: isEditMode ? 40 : 10,
                // Reseta X e Y do motion local pra que o offset seja recalculado do zero a cada arrasto
                x: 0, 
                y: 0 
              }}
              onDragOver={handleDragOver}
              onDrop={(e: any) => handleDropFromList(e, seat.id)}
              className={`flex flex-col items-center justify-center group ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 rounded-lg bg-white/50 backdrop-blur-sm' : 'cursor-pointer'}`}
            >
               {/* Tooltip Detalhado Popover (Só ativo fora do modo de edição) */}
              {!isEditMode && (
                <div 
                  className="absolute bottom-full left-[50%] mb-2.5 w-52 bg-white rounded-2xl shadow-[0_15px_40px_rgba(30,58,138,0.15)] ring-1 ring-gray-100 opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex flex-col items-center p-4 z-50 origin-bottom scale-95 group-hover:scale-100"
                  style={{ transform: `translateX(-50%)` }}
                >
                  {occupant ? (
                    <>
                      {occupant.foto_url || occupant.photo_url ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-[3px] border-blue-50 shadow-md">
                          <img src={occupant.foto_url || occupant.photo_url} alt={occupant.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3 shadow-md border-[3px] border-white">
                          <User className="w-7 h-7 text-blue-300" />
                        </div>
                      )}
                      <p className="text-sm font-black text-[#1e3a8a] text-center leading-tight mb-1">{occupant.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider">{occupant.roles?.name || occupant.role}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                        <MapPin className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-xs font-bold text-gray-400 text-center uppercase mt-1">Posto Disponível</p>
                    </>
                  )}
                  <div className="w-full h-px bg-gray-100 my-3"></div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#1e3a8a]/5 text-[#1e3a8a] px-2 py-1 rounded-md text-[10px] font-black uppercase">{seat.id}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{seat.type}</span>
                  </div>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-b border-r border-gray-100 rotate-45 rounded-sm"></div>
                </div>
              )}

              {/* CONTEÚDO VISUAL DA MESA */}
              {occupant ? (
                // MESA OCUPADA (Card Foto Redonda + Nome + Cargo)
                <div className="relative flex flex-col items-center justify-center w-full h-full bg-white/90 backdrop-blur-sm shadow-sm ring-1 ring-gray-200/50 rounded-xl group-hover:ring-blue-300 transition-all p-1">
                  
                  {/* Foto Redonda do Ocupante */}
                  <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 shadow-sm mb-0.5 border border-white">
                    {occupant.foto_url || occupant.photo_url ? (
                      <img src={occupant.foto_url || occupant.photo_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <User className="w-3 h-3 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  
                  <div className="absolute -top-1.5 -right-1.5 bg-[#1e3a8a] text-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm leading-none border border-white">
                    {seat.id}
                  </div>

                  {/* Nome (Primeiro + Inicial do Sobrenome) */}
                  <span className="block text-[8px] font-bold text-gray-900 text-center leading-tight truncate w-full px-0.5">
                    {(() => {
                      const parts = occupant.name.split(' ');
                      if (parts.length > 1) {
                        return `${parts[0]} ${parts[parts.length-1].charAt(0)}.`;
                      }
                      return parts[0];
                    })()}
                  </span>
                  
                  {/* Cargo Fino */}
                  <span className="block text-[6px] font-semibold text-gray-500 mt-0.5 w-full text-center truncate uppercase tracking-tight">
                    {getShortRole(occupant.roles?.name || occupant.role || '')}
                  </span>

                  {/* Overlay HTML5 Drag Drop invisível para arrastar PARA FORA o ocupante */}
                  {!isEditMode && (
                    <div 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('colabId', String(occupant.id));
                      }}
                      onDoubleClick={() => onRemoveSeat(String(occupant.id))}
                      className="absolute inset-0 cursor-grab active:cursor-grabbing border-2 border-transparent group-hover:border-blue-400/30 rounded-xl"
                      title="Arraste de volta para a lista ou clique duplo para remover"
                    />
                  )}
                </div>
              ) : (
                // MESA VAZIA (Ícone Discreto)
                <div className="flex flex-col items-center justify-center w-full h-full p-1 opacity-50 group-hover:opacity-100 transition-opacity bg-white/40 backdrop-blur-sm rounded-full ring-1 ring-gray-200 border border-dashed border-gray-300">
                  <MapPin className="w-5 h-5 text-gray-400 mb-0.5" />
                  <span className="text-[7px] font-black text-gray-500">{seat.id}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
