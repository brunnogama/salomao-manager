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




const W_STD = 85;
const H_STD = 110;
const MAP_W = 2600;
const MAP_H = 1800;

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
      left: pos === 2 ? 100 : 25, 
      top: 50 + room * 150 + (pos === 0 ? 0 : pos === 1 ? 75 : 40), 
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
      left: 25 + col * 85, top: 880 + row * 115, width: W_STD, height: H_STD
    };
  }),

  { id: 'SC01', type: 'SÓCIO', left: 220, top: 60, width: W_STD + 15, height: H_STD },

  // Blocos Centrais (Column Major)
  ...generateBlock('J', 'JÚNIOR', 16, 13, 240, 840, 2, 4, 115, 85, 185),
  ...generateBlock('E', 'ESTAGIÁRIO', 40, 1, 240 + 2*185, 840, 2, 4, 115, 85, 185),
  ...generateBlock('J', 'JÚNIOR', 16, 29, 240 + 7*185, 840, 2, 4, 115, 85, 185),

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
      left: 240 + block * 370 + colDentroDoBloco * 85, 
      top: 1350 + row * 115, 
      width: W_STD, height: H_STD
    }
  }),

  // A01-A22 (Coluna Direita, descendo abaixo de S21)
  // A21/A22 no topo, A01/A02 na base
  ...Array.from({length: 22}).map((_, i) => {
    const idNum = i + 1;
    const isOdd = idNum % 2 !== 0; 
    const col = isOdd ? 0 : 1; // Ímpar na esquerda, Par na direita
    const row = 10 - Math.floor((idNum - 1) / 2); // Linha 0 (A21/A22) até Linha 10 (A01/A02)
    
    return {
      id: `A${String(idNum).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
      left: 2320 + col * 85, 
      top: 660 + row * 115, 
      width: W_STD, height: H_STD
    }
  }),

  // S16-S18 Encartados
  { id: 'S16', type: 'SÊNIOR', left: 1950, top: 60, width: W_STD + 15, height: H_STD },
  { id: 'S17', type: 'SÊNIOR', left: 1950, top: 180, width: W_STD + 15, height: H_STD },
  { id: 'S18', type: 'SÊNIOR', left: 2060, top: 180, width: W_STD + 15, height: H_STD },

  // Corredor Direito
  { id: 'CONS01',   type: 'CONSULTOR', left: 2320, top: 60,  width: 90, height: H_STD },
  { id: 'SC02',     type: 'SÓCIO',     left: 2320, top: 180, width: 90, height: H_STD },
  { id: 'S19', type: 'SÊNIOR', left: 2320, top: 300, width: 90, height: H_STD },
  { id: 'S20', type: 'SÊNIOR', left: 2320, top: 420, width: 90, height: H_STD },
  { id: 'S21', type: 'SÊNIOR', left: 2320, top: 540, width: 90, height: H_STD },
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
          <div key={`room-s-${i}`} className="absolute left-[20px] w-[170px] h-[150px] border-2 border-black z-0 pointer-events-none" style={{ top: `${45 + i * 150}px` }}></div>
        ))}
        
        {/* Decorative Rooms Extra */}
        <div className="absolute top-[1200px] left-[20px] w-[170px] h-[60px] border-2 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[12px] font-bold">Cell</span>
        </div>
        <div className="absolute top-[1260px] left-[20px] w-[170px] h-[80px] border-2 border-t-0 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[12px] font-bold text-center leading-tight">Banheiro<br/>Feminino</span>
        </div>

        <div className="absolute top-[1200px] left-[2030px] w-[180px] h-[140px] border-2 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[14px] font-bold text-center">Sala de Reunião 5</span>
        </div>
        <div className="absolute top-[1200px] left-[2210px] w-[120px] h-[140px] border-2 border-l-0 border-black flex items-center justify-center pointer-events-none">
           <span className="text-[12px] font-bold text-center leading-tight">Banheiro<br/>Masculino</span>
        </div>
        
        {/* Right Consultant/Senior Rooms */}
        {Array.from({length: 5}).map((_, i) => (
          <div key={`room-sr-${i}`} className="absolute left-[2300px] w-[140px] h-[120px] border-2 border-black z-0 pointer-events-none" style={{ top: `${45 + i * 120}px` }}></div>
        ))}

        {/* Central Area Left */}
        <div className="absolute top-[45px] left-[190px] w-[900px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[820px] left-[190px] w-[900px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[45px] left-[190px] w-[2px] h-[777px] bg-black pointer-events-none" />
        <div className="absolute top-[45px] left-[1090px] w-[2px] h-[777px] bg-black pointer-events-none" />
        
        {/* SC01 Walls inside Left Area */}
        <div className="absolute top-[170px] left-[190px] w-[130px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[45px] left-[320px] w-[2px] h-[125px] bg-black pointer-events-none" />

        {/* Central Area Right */}
        <div className="absolute top-[45px] left-[1200px] w-[920px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[820px] left-[1200px] w-[920px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[45px] left-[1200px] w-[2px] h-[777px] bg-black pointer-events-none" />
        <div className="absolute top-[45px] left-[2120px] w-[2px] h-[777px] bg-black pointer-events-none" />
        
        {/* S16-S18 Walls inside Right Area */}
        <div className="absolute top-[280px] left-[1920px] w-[200px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[45px] left-[1920px] w-[2px] h-[235px] bg-black pointer-events-none" />
        <div className="absolute top-[45px] left-[2040px] w-[2px] h-[235px] bg-black pointer-events-none" />

        {SEATS_31_ANDAR.map(seat => {
          const occupant = seatsMap.get(seat.id.toUpperCase());
          const tooltipScale = Math.min(2, 1 / scale);

          return (
            <div
              key={seat.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, seat.id)}
              className="absolute flex flex-col items-center justify-start group cursor-pointer"
              style={{ 
                top: seat.top, 
                left: seat.left, 
                width: seat.width, 
                height: seat.height
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
                
                {/* Seta do popover */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
              </div>

              {/* ID do Posto flutuante em cima */}
              <span className={`block text-[13px] font-black tracking-tighter leading-none mb-1 ${seat.type.includes('ADMINISTRATIVO') || seat.type.includes('ADM') ? 'text-orange-600' : 'text-[#1e3a8a]'} ${!occupant ? 'opacity-50' : ''}`}>
                {seat.id}
              </span>

              {/* Conteúdo da Mesa: FOTO GRANDE E SEM QUADRADO */}
              {occupant ? (
                <div className="flex w-full flex-col items-center justify-start pointer-events-none group-hover:-translate-y-1 transition-transform">
                  {occupant.foto_url || occupant.photo_url ? (
                    <img 
                      src={occupant.foto_url || occupant.photo_url} 
                      alt="" 
                      className="w-[50px] h-[50px] object-cover rounded-full shadow-md border-2 border-white ring-2 ring-transparent group-hover:ring-[#1e3a8a]/30 transition-all"
                    />
                  ) : (
                    <div className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-100 ring-2 ring-transparent group-hover:ring-[#1e3a8a]/30 transition-all">
                      <User className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-start w-full leading-[10px] mt-1.5">
                    <span className="block text-[10px] font-bold text-gray-800 text-center truncate w-full px-0.5">
                      {occupant.name.split(' ')[0]} {occupant.name.split(' ').length > 1 ? occupant.name.split(' ')[1].charAt(0) + '.' : ''}
                    </span>
                    <span className="block text-[8px] mt-0.5 font-medium text-gray-500 uppercase text-center truncate w-full px-0.5">
                      {getShortRole(occupant.roles?.name || occupant.role || '')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-start opacity-30 mt-1 pointer-events-none group-hover:opacity-60 transition-opacity">
                  <div className="w-[48px] h-[48px] border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className={`block text-[7px] leading-tight font-black tracking-widest uppercase truncate mt-1 text-center w-[120%] ${
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
                </div>
              )}

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
