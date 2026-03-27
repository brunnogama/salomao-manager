import re

with open(r"c:\Users\MárcioGama\OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS\Área de Trabalho\Projetos\salomao-manager\src\components\collaborators\components\RHMapaAndar31.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_functions = """
const W_STD = 50;
const H_STD = 42;
const MAP_W = 1900;
const MAP_H = 1100;

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
      left: pos === 2 ? 80 : 25, 
      top: 40 + room * 120 + (pos === 0 ? 15 : pos === 1 ? 65 : 40), 
      width: W_STD, height: H_STD
    };
  }),

  // J01-J12
  ...Array.from({length: 12}).map((_, i) => {
    const idNum = i + 1; // 1 to 12
    const isOdd = idNum % 2 !== 0; // J01, J03 are right
    const col = isOdd ? 1 : 0;
    const row = Math.floor((idNum - 1) / 2); 
    return {
      id: `J${String(idNum).padStart(2,'0')}`, type: 'JÚNIOR',
      left: 20 + col * 55, top: 660 + row * 45, width: W_STD, height: H_STD
    };
  }),

  { id: 'SC01', type: 'SÓCIO', left: 165, top: 60, width: W_STD, height: H_STD },

  // Blocos Centrais (Column Major)
  ...generateBlock('J', 'JÚNIOR', 16, 13, 180, 640, 2, 4, 45, 55, 136),
  ...generateBlock('E', 'ESTAGIÁRIO', 40, 1, 180 + 2*136, 640, 2, 4, 45, 55, 136),
  ...generateBlock('J', 'JÚNIOR', 16, 29, 180 + 7*136, 640, 2, 4, 45, 55, 136),
  ...generateBlock('A', 'ADMINISTRATIVO', 16, 1, 180 + 9*136, 640, 2, 4, 45, 55, 136),

  // Plenos (P01-P24)
  ...Array.from({length: 24}).map((_, i) => {
    const idNum = i + 1;
    const block = Math.floor((idNum - 1) / 4);
    const row = Math.floor((idNum - 1) / 2) % 2;
    const col = (idNum % 2 !== 0) ? 1 : 0;
    return {
      id: `P${String(idNum).padStart(2,'0')}`, type: 'PLENO',
      left: 180 + block * 270 + col * 55, top: 940 + row * 45, width: W_STD, height: H_STD
    }
  }),

  // A17-A22
  ...Array.from({length: 6}).map((_, i) => {
    const idNum = i + 17;
    const inRow = i % 2; 
    const row = 2 - Math.floor(i / 2); 
    return {
      id: `A${String(idNum).padStart(2,'0')}`, type: 'ADMINISTRATIVO',
      left: 1710 + inRow * 55, top: 490 + row * 45, width: W_STD, height: H_STD
    }
  }),

  // S16-S18 Encartados
  { id: 'S16', type: 'SÊNIOR', left: 1475, top: 60, width: W_STD + 10, height: H_STD },
  { id: 'S17', type: 'SÊNIOR', left: 1475, top: 145, width: W_STD + 10, height: H_STD },
  { id: 'S18', type: 'SÊNIOR', left: 1555, top: 145, width: W_STD + 10, height: H_STD },

  // Corredor Direito
  { id: 'CONS01',   type: 'CONSULTOR', left: 1720, top: 50,  width: 90, height: H_STD },
  { id: 'SC02',     type: 'SÓCIO',     left: 1720, top: 130, width: 90, height: H_STD },
  { id: 'S19', type: 'SÊNIOR', left: 1720, top: 210, width: W_STD + 10, height: H_STD },
  { id: 'S20', type: 'SÊNIOR', left: 1720, top: 290, width: W_STD + 10, height: H_STD },
  { id: 'S21', type: 'SÊNIOR', left: 1720, top: 370, width: W_STD + 10, height: H_STD },
];
"""

new_walls = """
        {/* Left Seniores Rooms */}
        {Array.from({length: 5}).map((_, i) => (
          <div key={`room-s-${i}`} className="absolute left-[15px] w-[130px] h-[120px] border-2 border-black z-0 pointer-events-none" style={{ top: `${40 + i * 120}px` }}></div>
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
        <div className="absolute top-[585px] left-[145px] w-[700px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[145px] w-[2px] h-[552px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[845px] w-[2px] h-[552px] bg-black pointer-events-none" />
        
        {/* SC01 Walls inside Left Area */}
        <div className="absolute top-[130px] left-[145px] w-[100px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[245px] w-[2px] h-[95px] bg-black pointer-events-none" />

        {/* Central Area Right */}
        <div className="absolute top-[35px] left-[930px] w-[680px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[585px] left-[930px] w-[680px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[930px] w-[2px] h-[552px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[1610px] w-[2px] h-[552px] bg-black pointer-events-none" />
        
        {/* S16-S18 Walls inside Right Area */}
        <div className="absolute top-[210px] left-[1450px] w-[160px] h-[2px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[1450px] w-[2px] h-[175px] bg-black pointer-events-none" />
        <div className="absolute top-[35px] left-[1535px] w-[2px] h-[175px] bg-black pointer-events-none" />
"""

content = re.sub(r"const W_STD = 50;.*?\];", new_functions, content, flags=re.DOTALL)
content = re.sub(r"\{/\* Left Seniores Rooms \*/\}.*?\{/\* Divider between S15-17 and S18 \*/\}", new_walls.strip(), content, flags=re.DOTALL)

with open(r"c:\Users\MárcioGama\OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS\Área de Trabalho\Projetos\salomao-manager\src\components\collaborators\components\RHMapaAndar31.tsx", "w", encoding="utf-8") as f:
    f.write(content)
