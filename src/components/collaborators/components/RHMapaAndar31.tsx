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

function generateBlock(prefix: string, type: string, count: number, startId: number, startX: number, startY: number, cols: number = 2, rowSpacing: number = 45, colSpacing: number = 55, itemsPerBlock: number = 8, blockSpacingX: number = 135) {
  return Array.from({length: count}).map((_, i) => {
    const idNum = startId + i;
    const block = Math.floor(i / itemsPerBlock);
    const inBlock = i % itemsPerBlock;
    const col = inBlock % cols;
    const row = Math.floor(inBlock / cols);
    return {
      id: `${prefix}${String(idNum).padStart(2,'0')}`, type,
      left: startX + block * blockSpacingX + col * colSpacing,
      top: startY + row * rowSpacing,
      width: W_STD, height: H_STD
    };
  });
}

const SEATS_31_ANDAR: SeatDef[] = [
  // S01-S14 (2 colunas x 7 linhas extrema esquerda)
  ...Array.from({length: 14}).map((_, i) => ({
    id: `S${String(i+1).padStart(2,'0')}`, type: 'SÊNIOR',
    left: 20 + (i % 2) * 55, top: 40 + Math.floor(i / 2) * 60, width: W_STD, height: H_STD
  })),

  // J01-J12 (2 colunas x 6 linhas na extrema esquerda, abaixo de S01-S14)
  ...Array.from({length: 12}).map((_, i) => ({
    id: `J${String(i+1).padStart(2,'0')}`, type: 'JÚNIOR',
    left: 20 + (i % 2) * 55, top: 480 + Math.floor(i / 2) * 45, width: W_STD, height: H_STD
  })),

  { id: 'SC01', type: 'SÓCIO', left: 180, top: 50, width: W_STD + 10, height: H_STD },

  // Blocos Centrais Superiores aos Plenos
  // J13-J28 (2 blocos de 2x4)
  ...generateBlock('J', 'JÚNIOR', 16, 13, 180, 580, 2, 45, 55, 8, 136),
  // E01-E40 (5 blocos de 2x4)
  ...generateBlock('E', 'ESTAGIÁRIO', 40, 1, 180 + 2*136, 580, 2, 45, 55, 8, 136),
  // J29-J44 (2 blocos de 2x4)
  ...generateBlock('J', 'JÚNIOR', 16, 29, 180 + 7*136, 580, 2, 45, 55, 8, 136),
  // A01-A16 (2 blocos de 2x4)
  ...generateBlock('A', 'ADMINISTRATIVO', 16, 1, 180 + 9*136, 580, 2, 45, 55, 8, 136),

  // Plenos (P01-P24) - 6 blocos de 2x2 na base
  ...Array.from({length: 24}).map((_, i) => {
    const idNum = i + 1;
    const block = Math.floor(i / 4);
    const inBlock = i % 4;
    return {
      id: `P${String(idNum).padStart(2,'0')}`, type: 'PLENO',
      left: 180 + block * 250 + (inBlock % 2) * 55, top: 780 + Math.floor(inBlock / 2) * 45,
      width: W_STD, height: H_STD
    };
  }),

  // A17-A22 (1 bloco de 2x3 extrema direita, abaixo S21)
  ...Array.from({length: 6}).map((_, i) => ({
    id: `A${String(i+17).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
    left: 1720 + (i % 2) * 55, top: 490 + Math.floor(i / 2) * 45, width: W_STD, height: H_STD
  })),

  // S15-S18 Encartados no recorte superior direito
  { id: 'S15', type: 'SÊNIOR', left: 1475, top: 50,  width: W_STD + 10, height: H_STD },
  { id: 'S16', type: 'SÊNIOR', left: 1475, top: 105, width: W_STD + 10, height: H_STD },
  { id: 'S17', type: 'SÊNIOR', left: 1475, top: 160, width: W_STD + 10, height: H_STD },
  { id: 'S18', type: 'SÊNIOR', left: 1555, top: 105, width: W_STD + 10, height: H_STD },

  // Corredor Lateral Extrema Direita (Consultor, Sócios, S19-S21)
  { id: 'CONS01',   type: 'CONSULTOR', left: 1720, top: 40,  width: 90, height: H_STD },
  { id: 'SC02',     type: 'SÓCIO',     left: 1720, top: 110, width: 90, height: H_STD },
  { id: 'SC03',     type: 'SÓCIO',     left: 1720, top: 180, width: 90, height: H_STD },
  { id: 'S19', type: 'SÊNIOR', left: 1720, top: 250, width: W_STD + 10, height: H_STD },
  { id: 'S20', type: 'SÊNIOR', left: 1720, top: 310, width: W_STD + 10, height: H_STD },
  { id: 'S21', type: 'SÊNIOR', left: 1720, top: 370, width: W_STD + 10, height: H_STD },
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
        <div className="absolute top-[38px] left-[168px] w-[700px] h-1 bg-black z-0 pointer-events-none"></div> {/* Teto Esq */}
        <div className="absolute top-[542px] left-[168px] w-[700px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão Esq */}
        <div className="absolute top-[38px] left-[168px] w-1 h-[504px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Esq */}
        <div className="absolute top-[38px] left-[868px] w-1 h-[504px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Dir (Centro) */}
        
        {/* Recorte SC01 na quina superior esq */}
        <div className="absolute top-[105px] left-[168px] w-[95px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão SC01 */}
        <div className="absolute top-[38px] left-[263px] w-1 h-[68px] bg-black z-0 pointer-events-none"></div> {/* Parede Dir SC01 */}

        {/* Planta Arquitetônica (Paredes) - Direita */}
        <div className="absolute top-[38px] left-[950px] w-[678px] h-1 bg-black z-0 pointer-events-none"></div> {/* Teto Dir */}
        <div className="absolute top-[542px] left-[950px] w-[678px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão Dir */}
        <div className="absolute top-[38px] left-[950px] w-1 h-[504px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Esq (Centro) */}
        <div className="absolute top-[38px] left-[1628px] w-1 h-[504px] bg-black z-0 pointer-events-none"></div> {/* Parede Ext Dir */}
        
        {/* Recorte S15-S18 na quina superior direita */}
        <div className="absolute top-[215px] left-[1460px] w-[168px] h-1 bg-black z-0 pointer-events-none"></div> {/* Chão S15-S18 */}
        <div className="absolute top-[38px] left-[1460px] w-1 h-[178px] bg-black z-0 pointer-events-none"></div> {/* Parede Esq S15-S18 */}
        <div className="absolute top-[38px] left-[1540px] w-1 h-[178px] bg-black z-0 pointer-events-none"></div> {/* Divisória S15/16/17 e S18 */}

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
