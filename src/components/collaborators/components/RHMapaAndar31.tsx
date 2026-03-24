import React, { useMemo } from 'react';
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
const MAP_W = 1450;
const MAP_H = 750;

const SEATS_31_ANDAR: SeatDef[] = [
  // S1 a S14 (Lado Esq)
  ...Array.from({length: 14}).map((_, i) => ({
    id: `S${String(i+1).padStart(2,'0')}`, type: 'SÊNIOR',
    left: 20, top: 40 + (i * (H_STD + 4)), width: W_STD + 10, height: H_STD
  })),

  { id: 'SC01', type: 'SÓCIO', left: 120, top: 80, width: 90, height: 70 },

  // J01 a J12 (2 colunas x 6 linhas)
  ...Array.from({length: 12}).map((_, i) => ({
    id: `J${String(i+1).padStart(2,'0')}`, type: 'JÚNIOR',
    left: 100 + ((i % 2) * (W_STD + 4)), top: 460 + (Math.floor(i / 2) * (H_STD + 4)), width: W_STD, height: H_STD
  })),

  // P01 a P24 (Linha inferior longa)
  ...Array.from({length: 24}).map((_, i) => ({
    id: `P${String(i+1).padStart(2,'0')}`, type: 'PLENO',
    left: 100 + (i * (W_STD + 4)), top: 680, width: W_STD, height: H_STD
  })),

  // E01 a E18 (3 colunas x 6 linhas)
  ...Array.from({length: 18}).map((_, i) => ({
    id: `E${String(i+1).padStart(2,'0')}`, type: 'ESTAGIÁRIO',
    left: 400 + ((i % 3) * (W_STD + 4)), top: 460 + (Math.floor(i / 3) * (H_STD + 4)), width: W_STD, height: H_STD
  })),

  // J13 a J44 (4 colunas x 8 linhas)
  ...Array.from({length: 32}).map((_, i) => ({
    id: `J${String(i+13).padStart(2,'0')}`, type: 'JÚNIOR',
    left: 700 + ((i % 4) * (W_STD + 4)), top: 370 + (Math.floor(i / 4) * (H_STD + 4)), width: W_STD, height: H_STD
  })),

  // S16 a S21 (Coluna direita superior)
  ...Array.from({length: 6}).map((_, i) => ({
    id: `S${String(i+16).padStart(2,'0')}`, type: 'SÊNIOR',
    left: 1100, top: 40 + (i * (H_STD + 4)), width: W_STD + 10, height: H_STD
  })),

  { id: 'SC02', type: 'SÓCIO',     left: 1280, top: 40,  width: 90, height: 60 },
  { id: 'SC03', type: 'SÓCIO',     left: 1280, top: 120, width: 90, height: 60 },
  { id: 'CONS01', type: 'CONSULTOR', left: 1280, top: 200, width: 90, height: 60 },

  // A01 a A22 (2 colunas x 11 linhas)
  ...Array.from({length: 22}).map((_, i) => ({
    id: `A${String(i+1).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
    left: 1280 + ((i % 2) * (W_STD + 4)), top: 350 + (Math.floor(i / 2) * (H_STD + 4)), width: W_STD, height: H_STD
  })),
];

export function RHMapaAndar31({ collaborators, onAssignSeat, onRemoveSeat }: FloorPlanProps) {
  
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

  return (
    <div className="w-full h-[650px] overflow-auto border-2 border-gray-200 rounded-lg shadow-inner bg-gray-50/50 cursor-grab active:cursor-grabbing relative custom-scrollbar">
      <div 
        className="relative bg-white shadow-sm shrink-0 select-none overflow-hidden m-4 rounded-xl ring-1 ring-gray-200"
        style={{ width: MAP_W, height: MAP_H }}
      >
        
        {/* Background Decorativo Simulando a Planta */}
        <div className="absolute top-[80px] left-[150px] w-[350px] h-[350px] border-2 border-gray-100 bg-gray-50/50 pointer-events-none flex items-center justify-center rounded-lg">
          <span className="text-gray-200 font-bold text-4xl rotate-45 opacity-40">Área Central Esq</span>
        </div>
        <div className="absolute top-[80px] left-[650px] w-[350px] h-[250px] border-2 border-gray-100 bg-gray-50/50 pointer-events-none flex items-center justify-center rounded-lg">
          <span className="text-gray-200 font-bold text-4xl -rotate-45 opacity-40">Área Central Dir</span>
        </div>

        {SEATS_31_ANDAR.map(seat => {
          const occupant = seatsMap.get(seat.id.toUpperCase());

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
               {/* Tooltip Hover Exclusivo */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center p-3 z-50">
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

              {/* Conteúdo da Mesa */}
              <div className="w-full text-center px-0.5 mt-0.5">
                <span className={`block text-[10px] leading-[10px] font-black tracking-tighter ${occupant ? 'text-gray-800' : 'text-gray-500'}`}>
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
