import React, { useMemo } from 'react';
import { Collaborator } from '../../../types/controladoria';
import { User, MapPin } from 'lucide-react';

interface FloorPlanProps {
  collaborators: Collaborator[];
  onAssignSeat: (collaboratorId: string, seatId: string) => void;
  onRemoveSeat: (collaboratorId: string) => void;
}

// Seat Data Structure
interface SeatDef {
  id: string; // Ex: S01, J19
  type: 'SÓCIO' | 'SÊNIOR' | 'PLENO' | 'JÚNIOR' | 'ESTAGIÁRIO' | 'ADMINISTRATIVO' | 'CONSULTOR';
  top: number; // percentage %
  left: number; // percentage %
  width: number; // percentage %
  height: number; // percentage %
}

// Approximated locations based on the architectural drawing
const SEATS_31_ANDAR: SeatDef[] = [
  // Seniores - Lado Esquerdo (Salas 1 a 14)
  ...Array.from({length: 14}).map((_, i) => ({
    id: `S${String(i+1).padStart(2,'0')}`,
    type: 'SÊNIOR' as const,
    left: 2, top: 2 + (i * 6), width: 6, height: 5
  })),
  // Sócio - Esquerda centralizada
  { id: 'SC01', type: 'SÓCIO', left: 9, top: 10, width: 8, height: 8 },
  
  // Juniores - Fileira ao lado dos Seniores (J01 a J11)
  ...Array.from({length: 11}).map((_, i) => ({
    id: `J${String(i+1).padStart(2,'0')}`,
    type: 'JÚNIOR' as const,
    left: 10, top: 55 + (i * 3.5), width: 4, height: 3
  })),

  // Plenos - Fileira Inferior (P01 a P19)
  ...Array.from({length: 19}).map((_, i) => ({
    id: `P${String(i+1).padStart(2,'0')}`,
    type: 'PLENO' as const,
    left: 10 + (i * 4.5), top: 92, width: 4, height: 5
  })),

  // Estagiários - Bloco central esquerdo inferior (E01 a E18)
  ...Array.from({length: 18}).map((_, i) => ({
    id: `E${String(i+1).padStart(2,'0')}`,
    type: 'ESTAGIÁRIO' as const,
    left: 28 + (Math.floor(i/6) * 6), top: 75 + ((i%6) * 2.5), width: 5, height: 2
  })),

  // Administrativos - Lado Direito Inferior e Canto (A01 a A22)
  ...Array.from({length: 22}).map((_, i) => ({
    id: `A${String(i+1).padStart(2,'0')}`,
    type: 'ADMINISTRATIVO' as const,
    left: 90 + (Math.floor(i/11) * 4), top: 50 + ((i%11) * 4), width: 3.5, height: 3
  })),

  // Mais Juniores espalhados (Ex: J13 a J44) agrupados no centro-direita
  ...Array.from({length: 32}).map((_, i) => ({
    id: `J${String(i+13).padStart(2,'0')}`,
    type: 'JÚNIOR' as const,
    left: 50 + (Math.floor(i/8) * 9), top: 70 + ((i%8) * 2.5), width: 4, height: 2
  })),

  // Seniores - Lado Direito Superior (S16 - S21)
  ...Array.from({length: 6}).map((_, i) => ({
    id: `S${String(i+16).padStart(2,'0')}`,
    type: 'SÊNIOR' as const,
    left: 80, top: 2 + (i * 6), width: 6, height: 5
  })),
  // Outros Sócios Direita (SC02, SC03)
  { id: 'SC02', type: 'SÓCIO', left: 90, top: 2, width: 8, height: 8 },
  { id: 'SC03', type: 'SÓCIO', left: 90, top: 12, width: 8, height: 8 },
  { id: 'CONS01', type: 'CONSULTOR', left: 90, top: 22, width: 8, height: 8 },
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
      if (c.posto) {
        map.set(c.posto.toUpperCase(), c);
      }
    });
    return map;
  }, [collaborators]);

  return (
    <div className="relative w-full aspect-[2.5/1] bg-white border-2 border-gray-200 rounded-lg shadow-inner overflow-hidden select-none">
      
      {/* Background Decorativo para simular as salas principais (corredores e vãos da planta) */}
      <div className="absolute top-[5%] left-[10%] w-[30%] h-[50%] border-2 border-gray-100 bg-gray-50/50 pointer-events-none flex items-center justify-center">
        <span className="text-gray-200 font-bold text-4xl rotate-45 opacity-50">Área Central Esq</span>
      </div>
      <div className="absolute top-[5%] right-[20%] w-[25%] h-[50%] border-2 border-gray-100 bg-gray-50/50 pointer-events-none flex items-center justify-center">
        <span className="text-gray-200 font-bold text-4xl -rotate-45 opacity-50">Área Central Dir</span>
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
              top: `${seat.top}%`, 
              left: `${seat.left}%`, 
              width: `${seat.width}%`, 
              height: `${seat.height}%`,
              borderRadius: '2px'
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

            {/* Conteudo da Mesa */}
            <div className="w-full text-center px-0.5">
              <span className={`block text-[0.45rem] sm:text-[0.6rem] font-black tracking-tighter ${occupant ? 'text-gray-800' : 'text-gray-400'}`}>
                {seat.id}
              </span>
              <span className={`block text-[0.35rem] sm:text-[0.45rem] font-bold tracking-widest uppercase ${
                seat.type === 'SÓCIO' ? 'text-red-500' :
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
              <div className={`mt-0.5 sm:mt-1 w-1.5 h-1.5 sm:w-2 sm:h-2 mx-auto rounded-full transition-colors ${occupant ? getSegmentColor(occupant) : 'bg-transparent border border-gray-200'}`}></div>
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
  );
}
