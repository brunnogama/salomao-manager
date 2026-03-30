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

const W_STD = 86;
const H_STD = 60;
const MAP_W = 1650;
const MAP_H = 1100;

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
      left: 15 + col * W_STD, top: 740 + row * H_STD, width: W_STD, height: H_STD
    };
  }),

  { id: 'SC01', type: 'SÓCIO', left: 200, top: 40, width: 100, height: 70 },

  // Blocos Centrais (Column Major)
  ...generateBlock('J', 'JÚNIOR', 16, 13, 200, 720, 2, 4, 25),
  ...generateBlock('E', 'ESTAGIÁRIO', 40, 1, 200 + (2 * W_STD + 25) * 2, 720, 2, 4, 15),
  ...generateBlock('J', 'JÚNIOR', 16, 29, 200 + (2 * W_STD + 25) * 2 + (10 * W_STD + 15 * 4) + 10, 720, 2, 4, 25),

  // Plenos (P01-P24)
  ...Array.from({length: 24}).map((_, i) => {
    const idNum = i + 1;
    const block = Math.floor((idNum - 1) / 8);
    const colDentroDoBloco = Math.floor((idNum - 1) / 2) % 4;
    const isTopRow = (idNum % 2 === 0);
    const row = isTopRow ? 0 : 1;
    
    return {
      id: `P${String(idNum).padStart(2,'0')}`, type: 'PLENO',
      left: 200 + block * (4 * W_STD + 25) + colDentroDoBloco * W_STD, 
      top: 980 + row * H_STD, 
      width: W_STD, height: H_STD
    }
  }),

  // A01-A22 (Coluna Direita reduzia 400px do vazio)
  ...Array.from({length: 22}).map((_, i) => {
    const idNum = i + 1;
    const isOdd = idNum % 2 !== 0; 
    const col = isOdd ? 0 : 1;
    const row = 10 - Math.floor((idNum - 1) / 2); 
    return {
      id: `A${String(idNum).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
      left: 1460 + col * W_STD, 
      top: 540 + row * H_STD, 
      width: W_STD, height: H_STD
    }
  }),

  // S16-S18 Encartados
  { id: 'S16', type: 'SÊNIOR', left: 1140, top: 40, width: W_STD + 15, height: 65 },
  { id: 'S17', type: 'SÊNIOR', left: 1140, top: 120, width: W_STD + 15, height: 65 },
  { id: 'S18', type: 'SÊNIOR', left: 1250, top: 120, width: W_STD + 15, height: 65 },

  // Corredor Direito (Compresso 400px pra esquerda)
  { id: 'CONS01',   type: 'CONSULTOR', left: 1460, top: 40,  width: W_STD * 2, height: 65 },
  { id: 'SC02',     type: 'SÓCIO',     left: 1460, top: 115, width: W_STD * 2, height: 75 },
  { id: 'S19', type: 'SÊNIOR', left: 1460, top: 200, width: W_STD * 2, height: 65 },
  { id: 'S20', type: 'SÊNIOR', left: 1460, top: 275, width: W_STD * 2, height: 65 },
  { id: 'S21', type: 'SÊNIOR', left: 1460, top: 350, width: W_STD * 2, height: 65 },
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
          // A imagem de fundo é opcional, caso queira substituir as linhas pelo PNG
          backgroundImage: "url('/mapa_base_31.png')",
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      >
        {/* Linhas da Planta Baixa (CSS Walls Restored) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Left Seniores Rooms */}
          {Array.from({length: 5}).map((_, i) => (
            <div key={`room-s-${i}`} className="absolute left-[15px] w-[140px] h-[130px] border border-gray-300" style={{ top: `${35 + i * 130}px` }}></div>
          ))}
          
          {/* Decorative Rooms Extra */}
          <div className="absolute top-[800px] left-[15px] w-[140px] h-[50px] border border-gray-300 flex items-center justify-center">
             <span className="text-[12px] font-bold text-gray-400">Cell</span>
          </div>
          <div className="absolute top-[850px] left-[15px] w-[140px] h-[70px] border border-t-0 border-gray-300 flex items-center justify-center">
             <span className="text-[12px] font-bold text-center leading-tight text-gray-400">Banheiro<br/>Feminino</span>
          </div>

          {/* Right Consultant/Senior Rooms */}
          {/* Sala 1 e 2 independentes */}
          <div className="absolute left-[1460px] w-[150px] h-[70px] border border-gray-300" style={{ top: '35px' }}></div>
          <div className="absolute left-[1460px] w-[150px] h-[80px] border border-gray-300" style={{ top: '105px' }}></div>
          <div className="absolute left-[1610px] w-[50px] h-[150px] border border-gray-300 border-l-0" style={{ top: '35px' }}></div>
          
          {/* SALA UNIFICADA para S19, S20, S21 */}
          <div className="absolute left-[1460px] w-[150px] h-[240px] border border-gray-300" style={{ top: '185px' }}></div>

          <div className="absolute top-[880px] left-[1460px] w-[150px] h-[80px] border border-gray-300 flex items-center justify-center">
             <span className="text-[12px] font-bold text-center text-gray-400">Sala de Reunião 5</span>
          </div>
          <div className="absolute top-[880px] left-[1610px] w-[50px] h-[80px] border border-gray-300 flex items-center justify-center">
             <span className="text-[10px] font-bold text-center leading-tight rotate-90 text-gray-400">Banheiro<br/>Masc</span>
          </div>

          {/* Central Area Left */}
          <div className="absolute top-[35px] left-[170px] w-[350px] h-[1px] bg-gray-300" />
          <div className="absolute top-[650px] left-[170px] w-[350px] h-[1px] bg-gray-300" />
          <div className="absolute top-[35px] left-[170px] w-[1px] h-[615px] bg-gray-300" />
          <div className="absolute top-[35px] left-[520px] w-[1px] h-[615px] bg-gray-300" />
          
          {/* SC01 Walls inside Left Area */}
          <div className="absolute top-[120px] left-[170px] w-[130px] h-[1px] bg-gray-300" />
          <div className="absolute top-[35px] left-[300px] w-[1px] h-[85px] bg-gray-300" />

          {/* Central Area Right */}
          <div className="absolute top-[35px] left-[560px] w-[800px] h-[1px] bg-gray-300" />
          <div className="absolute top-[650px] left-[560px] w-[800px] h-[1px] bg-gray-300" />
          <div className="absolute top-[35px] left-[560px] w-[1px] h-[615px] bg-gray-300" />
          <div className="absolute top-[35px] left-[1360px] w-[1px] h-[615px] bg-gray-300" />
          
          {/* S16-S18 Walls inside Right Area */}
          <div className="absolute top-[200px] left-[1130px] w-[230px] h-[1px] bg-gray-300" />
          <div className="absolute top-[35px] left-[1130px] w-[1px] h-[165px] bg-gray-300" />
          <div className="absolute top-[35px] left-[1240px] w-[1px] h-[165px] bg-gray-300" />
        </div>

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
                <div className="relative flex flex-col items-center justify-evenly w-full h-full bg-white/95 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-gray-200/50 rounded-xl group-hover:ring-blue-400 group-hover:shadow-md transition-all p-1.5 overflow-hidden">
                  
                  {/* Foto Redonda do Ocupante maior */}
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-100 shadow-sm border border-white shrink-0">
                    {occupant.foto_url || occupant.photo_url ? (
                      <img src={occupant.foto_url || occupant.photo_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  
                  {/* A badge do ID do posto foi removida daqui a pedido do usuário */}

                  {/* Organização dos Textos de Forma Compacta porém legível */}
                  <div className="w-full flex flex-col items-center mt-1 shrink-0 px-0.5">
                    <span className="text-[10px] font-extrabold text-[#0a192f] text-center leading-[1.1] truncate w-full drop-shadow-sm">
                      {(() => {
                        const parts = occupant.name.split(' ');
                        let finalName = parts[0];
                        if (parts.length > 1 && finalName.length <= 8) {
                           finalName += ` ${parts[parts.length-1].charAt(0)}.`;
                        }
                        return finalName;
                      })()}
                    </span>
                    
                    <span className="text-[8px] font-bold text-gray-500 mt-[1px] text-center truncate uppercase tracking-widest w-full opacity-80">
                      {getShortRole(occupant.roles?.name || occupant.role || '')}
                    </span>
                  </div>

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
