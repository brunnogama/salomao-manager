import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Collaborator } from '../../../types/controladoria';
import { User, MapPin } from 'lucide-react';

interface FloorPlanProps {
  collaborators: Collaborator[];
  onAssignSeat: (collaboratorId: string, seatId: string) => void;
  onRemoveSeat: (collaboratorId: string) => void;
}

interface SeatDef {
  id: string;
  type: string;
  left: number; // pixels
  top: number; //  pixels
  width: number; // pixels
  height: number; // pixels
}




const W_STD = 55;
const H_STD = 75;
const MAP_W = 1950;
const MAP_H = 1350;

function generateBlock(prefix: string, type: string, count: number, startId: number, startX: number, startY: number, cols: number = 2, rows: number = 4, rowSpacing: number = 45, colSpacing: number = 55, blockSpacingX: number = 135) {
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
      left: startX + block * blockSpacingX + col * colSpacing,
      top: startY + row * rowSpacing,
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
      left: pos === 2 ? 80 : 22, 
      top: 35 + room * 120 + (pos === 0 ? 5 : pos === 1 ? 55 : 30), 
      width: W_STD, height: H_STD - 20
    };
  }),

  // J01-J12
  ...Array.from({length: 12}).map((_, i) => {
    const idNum = i + 1; 
    const isOdd = idNum % 2 !== 0; 
    const col = isOdd ? 1 : 0;
    const row = Math.floor((idNum - 1) / 2); 
    return {
      id: `J${String(idNum).padStart(2,'0')}`, type: 'JÚNIOR',
      left: 20 + col * 60, top: 680 + row * 55, width: W_STD, height: H_STD - 10
    };
  }),

  { id: 'SC01', type: 'SÓCIO', left: 165, top: 40, width: W_STD + 15, height: H_STD },

  // Blocos Centrais (Column Major)
  ...generateBlock('J', 'JÚNIOR', 16, 13, 180, 640, 2, 4, 78, 60, 140),
  ...generateBlock('E', 'ESTAGIÁRIO', 40, 1, 180 + 2*140, 640, 2, 4, 78, 60, 140),
  ...generateBlock('J', 'JÚNIOR', 16, 29, 180 + 7*140, 640, 2, 4, 78, 60, 140),
  ...generateBlock('A', 'ADMINISTRATIVO', 16, 1, 180 + 9*140, 640, 2, 4, 78, 60, 140),

  // Plenos (P01-P24)
  ...Array.from({length: 24}).map((_, i) => {
    const idNum = i + 1;
    const block = Math.floor((idNum - 1) / 4);
    const row = Math.floor((idNum - 1) / 2) % 2;
    const col = (idNum % 2 !== 0) ? 1 : 0;
    return {
      id: `P${String(idNum).padStart(2,'0')}`, type: 'PLENO',
      left: 180 + block * 280 + col * 60, top: 1040 + row * 80, width: W_STD, height: H_STD
    }
  }),

  // A17-A22
  ...Array.from({length: 6}).map((_, i) => {
    const idNum = i + 17;
    const inRow = i % 2; 
    const row = 2 - Math.floor(i / 2); 
    return {
      id: `A${String(idNum).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
      left: 1720 + inRow * 60, top: 510 + row * 80, width: W_STD, height: H_STD
    }
  }),

  // S16-S18 Encartados
  { id: 'S16', type: 'SÊNIOR', left: 1475, top: 50, width: W_STD + 15, height: H_STD - 15 },
  { id: 'S17', type: 'SÊNIOR', left: 1475, top: 135, width: W_STD + 15, height: H_STD - 15 },
  { id: 'S18', type: 'SÊNIOR', left: 1560, top: 135, width: W_STD + 15, height: H_STD - 15 },

  // Corredor Direito
  { id: 'CONS01',   type: 'CONSULTOR', left: 1720, top: 40,  width: 90, height: H_STD - 15 },
  { id: 'SC02',     type: 'SÓCIO',     left: 1720, top: 120, width: 90, height: H_STD - 15 },
  { id: 'S19', type: 'SÊNIOR', left: 1720, top: 200, width: 90, height: H_STD - 15 },
  { id: 'S20', type: 'SÊNIOR', left: 1720, top: 280, width: 90, height: H_STD - 15 },
  { id: 'S21', type: 'SÊNIOR', left: 1720, top: 360, width: 90, height: H_STD - 15 },
];




export function RHMapaAndar31({ collaborators, onAssignSeat, onRemoveSeat }: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, seatId: string) => {
    e.preventDefault();
    const colabId = e.dataTransfer.getData('colabId');
    if (colabId) {
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

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const newScale = Math.min(1, (width - 32) / MAP_W);
          setScale(Math.max(0.3, newScale));
        }
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full relative flex justify-center items-start bg-gray-50/50 border-2 border-gray-200 rounded-lg shadow-inner overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ height: `${MAP_H * scale + 32}px`, touchAction: 'none' }}
    >
      <div 
        id="mapa-31-andar-content"
        className="relative bg-white shrink-0 select-none m-4 rounded-xl shadow-sm ring-1 ring-gray-200"
        style={{ 
          width: MAP_W, 
          height: MAP_H, 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out'
        }}
      >
              {/* Left Seniores Rooms */}
        {Array.from({length: 5}).map((_, i) => (
          <div key={`room-s-${i}`} className="absolute left-[15px] w-[130px] h-[120px] border-2 border-black z-0 pointer-events-none" style={{ top: `${35 + i * 120}px` }}></div>
        ))}
        
        {/* Decorative Rooms Extra */}
        <div className="absolute top-[930px] left-[15px] w-[130px] h-[50px] border-2 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[12px] font-bold">Cell</span>
        </div>
        <div className="absolute top-[980px] left-[15px] w-[130px] h-[70px] border-2 border-t-0 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[12px] font-bold text-center leading-tight">Banheiro<br/>Feminino</span>
        </div>

        <div className="absolute top-[930px] left-[1550px] w-[150px] h-[120px] border-2 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[14px] font-bold text-center">Sala de Reunião 5</span>
        </div>
        <div className="absolute top-[930px] left-[1700px] w-[100px] h-[120px] border-2 border-l-0 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[12px] font-bold text-center leading-tight">Banheiro<br/>Masculino</span>
        </div>
        
        {/* Right Consultant/Senior Rooms */}
        {Array.from({length: 5}).map((_, i) => (
          <div key={`room-sr-${i}`} className="absolute left-[1700px] w-[100px] h-[80px] border-2 border-black z-0 pointer-events-none" style={{ top: `${35 + i * 80}px` }}></div>
        ))}

        {/* Central Area Left */}
        <div className="absolute top-[35px] left-[145px] w-[700px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[630px] left-[145px] w-[700px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[145px] w-[2px] h-[597px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[845px] w-[2px] h-[597px] bg-black pointer-events-none" />
        
        {/* SC01 Walls inside Left Area */}
        <div className="absolute top-[130px] left-[145px] w-[100px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[245px] w-[2px] h-[95px] bg-black pointer-events-none" />

        {/* Central Area Right */}
        <div className="absolute top-[35px] left-[930px] w-[690px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[630px] left-[930px] w-[690px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[930px] w-[2px] h-[597px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[1620px] w-[2px] h-[597px] bg-black pointer-events-none" />
        
        {/* S16-S18 Walls inside Right Area */}
        <div className="absolute top-[210px] left-[1450px] w-[160px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[1450px] w-[2px] h-[175px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[1545px] w-[2px] h-[175px] bg-black pointer-events-none" />

        {SEATS_31_ANDAR.map(seat => {
          const occupant = seatsMap.get(seat.id.toUpperCase());
          const tooltipScale = Math.min(2, 1 / scale);

          return (
            <div
              key={seat.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, seat.id)}
              className="absolute border border-gray-300 bg-white shadow-sm flex flex-col items-center justify-center group transition-all duration-200 hover:z-10 hover:shadow-lg hover:ring-2 hover:ring-[#1e3a8a]/50 cursor-pointer"
              style={{ 
                top: seat.top, 
                left: seat.left, 
                width: seat.width, 
                height: seat.height,
                borderRadius: '4px'
              }}
            >
               {/* Tooltip Counter-Scaled */}
              <div 
                className="absolute bottom-full left-[50%] mb-2.5 w-48 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 ring-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center p-3 z-50 origin-bottom"
                style={{ transform: `translateX(-50%) scale(${tooltipScale})` }}
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
                
                {/* Seta do popover (seta cresce para baixo) */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
              </div>

              {/* Conteúdo da Mesa */}
              <div className="w-full h-full flex flex-col items-center justify-between py-1 px-1 overflow-hidden">
                <span className={`block text-[11px] font-black tracking-tighter ${seat.type.includes('ADMINISTRATIVO') || seat.type.includes('ADM') ? 'text-orange-600' : 'text-[#1e3a8a]'} ${!occupant ? 'opacity-50' : ''}`}>
                  {seat.id}
                </span>

                {occupant ? (
                  <>
                    <div className="flex-1 w-full flex items-center justify-center min-h-0 pt-0.5 pointer-events-none">
                      {occupant.foto_url || occupant.photo_url ? (
                        <img 
                          src={occupant.foto_url || occupant.photo_url} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded-full border border-gray-200 shadow-sm transition-transform group-hover:scale-105 group-hover:shadow-md"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="block text-[6px] leading-[8px] font-bold text-gray-700 uppercase pt-1 w-full text-center">
                      {getShortRole(occupant.roles?.name || occupant.role || '')}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex items-center justify-center opacity-10">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className={`block text-[6px] leading-[8px] font-bold tracking-widest uppercase truncate mt-0.5 ${
                      seat.type === 'SÓCIO' ? 'text-red-700' :
                      seat.type === 'SÊNIOR' ? 'text-red-600' :
                      seat.type === 'ESTAGIÁRIO' ? 'text-orange-600' :
                      seat.type === 'ADMINISTRATIVO' ? 'text-purple-700' :
                      seat.type === 'CONSULTOR' ? 'text-amber-600' :
                      seat.type === 'JÚNIOR' ? 'text-blue-600' :
                      'text-emerald-600' // PLENO
                    }`}>
                      {seat.type}
                    </span>
                  </>
                )}
              </div>

              {/* Overlay invisível arrastável se houver ocupante para TIRAR do posto */}
              {occupant && (
                <div 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('colabId', String(occupant.id));
                  }}
                  onDoubleClick={() => onRemoveSeat(String(occupant.id))}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                  title="Arraste de volta para a lista ou clique duplo para remover"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
