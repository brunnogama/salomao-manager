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

const W_STD = 50;
const H_STD = 42;
const MAP_W = 1900;
const MAP_H = 920;

function generateBlock(prefix: string, type: string, count: number, startId: number, startX: number, startY: number, cols: number = 2, blockSpacingX: number = 135) {
  return Array.from({length: count}).map((_, i) => {
    const idNum = startId + i;
    const itemsPerBlock = cols * 4; 
    const block = Math.floor(i / itemsPerBlock);
    const inBlock = i % itemsPerBlock;
    const col = inBlock % cols;
    const row = Math.floor(inBlock / cols);
    return {
      id: `${prefix}${String(idNum).padStart(2,'0')}`, type,
      left: startX + block * blockSpacingX + col * 55,
      top: startY + row * 45,
      width: W_STD, height: H_STD
    };
  });
}

function generatePlenoBlocks() {
  return Array.from({length: 24}).map((_, i) => {
    const idNum = i + 1;
    const itemsPerBlock = 4; 
    const block = Math.floor(i / itemsPerBlock);
    const inBlock = i % itemsPerBlock;
    const col = inBlock % 2;
    const row = Math.floor(inBlock / 2);
    // Espaçamento 260 entre os blocos (6 blocos plenos na horizontal)
    return {
      id: `P${String(idNum).padStart(2,'0')}`, type: 'PLENO',
      left: 200 + block * 260 + col * 55, 
      top: 760 + row * 45,
      width: W_STD, height: H_STD
    };
  });
}

function generateAdmBlock() {
  return Array.from({length: 22}).map((_, i) => {
    const idNum = i + 1;
    const col = i % 2;
    const row = Math.floor(i / 2);
    return {
      id: `A${String(idNum).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
      left: 1720 + col * 55, 
      top: 360 + row * 45,
      width: W_STD, height: H_STD
    };
  });
}

const SEATS_31_ANDAR: SeatDef[] = [
  // S01-S14 (7 salas de 2 na borda esquerda)
  ...Array.from({length: 14}).map((_, i) => ({
    id: `S${String(i+1).padStart(2,'0')}`, type: 'SÊNIOR',
    left: 20, top: 40 + Math.floor(i / 2) * 100 + (i % 2) * 45, width: W_STD + 10, height: H_STD
  })),

  { id: 'SC01', type: 'SÓCIO', left: 100, top: 40, width: 90, height: 70 },

  // Juniors (J01-J24) - 3 blocos de 2x4
  ...generateBlock('J', 'JÚNIOR', 24, 1, 200, 530),
  
  // Estagiários (E01-E40) - 5 blocos de 2x4
  ...generateBlock('E', 'ESTAGIÁRIO', 40, 1, 605, 530),

  // Juniors (J25-J44) - 2 blocos de 2x4 e 1 bloco final de 2x2
  ...generateBlock('J', 'JÚNIOR', 20, 25, 1280, 530),

  // Plenos (P01-P24) - 6 blocos de 2x2 na base
  ...generatePlenoBlocks(),

  // Administrativos (A01-A22) - Bloco de 2x11 na direita
  ...generateAdmBlock(),

  // S15-S21 (borda direita e canto)
  ...Array.from({length: 7}).map((_, i) => ({
    id: `S${String(i+15).padStart(2,'0')}`, type: 'SÊNIOR',
    left: 1600, top: 40 + Math.floor(i / 2) * 100 + (i % 2) * 45, width: W_STD + 10, height: H_STD
  })),

  // Sócios/Consultores Extrema Direita
  { id: 'SC02',     type: 'SÓCIO',     left: 1720, top: 40,  width: 90, height: 60 },
  { id: 'SC03',     type: 'SÓCIO',     left: 1720, top: 140, width: 90, height: 60 },
  { id: 'CONS01',   type: 'CONSULTOR', left: 1720, top: 240, width: 90, height: 60 },
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

  const getSegmentColor = (c: Collaborator) => {
    const area = String(c.area || '');
    if (area === 'Administrativa') return 'bg-orange-500';
    if (area === 'Terceirizada') return 'bg-emerald-500';
    return 'bg-[#1e3a8a]'; // Juridico default
  };

  const seatsMap = useMemo(() => {
    const map = new Map<string, Collaborator>();
    collaborators.forEach(c => {
      if (c.posto) map.set(c.posto.toUpperCase(), c);
    });
    return map;
  }, [collaborators]);

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
        className="relative bg-white shrink-0 select-none m-4 rounded-xl shadow-sm ring-1 ring-gray-200"
        style={{ 
          width: MAP_W, 
          height: MAP_H, 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out'
        }}
      >
              {/* Planta Arquitetônica (Paredes) - Esquerda */}
        <div className="absolute top-[38px] left-[108px] w-[756px] h-1 bg-black z-0 pointer-events-none"></div> {/* Teto Esq */}
        <div className="absolute top-[490px] left-[108px] w-[756px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão Esq */}
        <div className="absolute top-[38px] left-[108px] w-1 h-[456px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Esq */}
        <div className="absolute top-[38px] left-[860px] w-1 h-[456px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Dir (Centro) */}
        <div className="absolute top-[110px] left-[108px] w-[90px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão SC01 */}
        <div className="absolute top-[38px] left-[196px] w-1 h-[456px] bg-black z-0 pointer-events-none"></div> {/* Parede Corredor Esq */}

        {/* Planta Arquitetônica (Paredes) - Direita */}
        <div className="absolute top-[38px] left-[1020px] w-[690px] h-1 bg-black z-0 pointer-events-none"></div> {/* Teto Dir */}
        <div className="absolute top-[490px] left-[1020px] w-[600px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão Dir (até o corredor) */}
        <div className="absolute top-[38px] left-[1020px] w-1 h-[456px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Esq (Centro) */}
        <div className="absolute top-[38px] left-[1706px] w-1 h-[456px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Dir */}
        
        {/* Recortes Direita (S15-S21 e Consultor) */}
        <div className="absolute top-[38px] left-[1620px] w-1 h-[456px] bg-black z-0 pointer-events-none"></div> {/* Parede Corredor Dir */}
        <div className="absolute top-[130px] left-[1400px] w-[220px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão S15-S18 */}
        <div className="absolute top-[38px] left-[1550px] w-1 h-[96px] bg-black z-0 pointer-events-none"></div> {/* Divisória S16/S18 */}

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
              <div className="w-full text-center px-0.5 mt-0.5">
                <span className={`block text-sm leading-tight font-black tracking-tighter ${occupant ? 'text-gray-800' : 'text-gray-500'}`}>
                  {seat.id}
                </span>
                <span className={`block text-[6px] leading-[8px] font-bold tracking-widest uppercase truncate mt-0.5 ${
                  seat.type === 'SÓCIO' ? 'text-red-600' :
                  seat.type === 'SÊNIOR' ? 'text-red-500' :
                  seat.type === 'ESTAGIÁRIO' ? 'text-orange-500' :
                  seat.type === 'ADMINISTRATIVO' ? 'text-purple-600' :
                  seat.type === 'CONSULTOR' ? 'text-amber-500' :
                  seat.type === 'JÚNIOR' ? 'text-blue-500' :
                  'text-emerald-500' // PLENO
                }`}>
                  {seat.type}
                </span>
                
                {/* Bolinha de ocupante */}
                <div className={`mt-1 w-2 h-2 mx-auto rounded-full transition-colors ${occupant ? getSegmentColor(occupant) : 'bg-transparent border border-gray-200'}`}></div>
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
