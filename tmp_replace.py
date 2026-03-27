import re
import sys

with open(r"c:\Users\MárcioGama\OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS\Área de Trabalho\Projetos\salomao-manager\src\components\collaborators\components\RHMapaAndar31.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_functions = """
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
"""

new_walls = """
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
"""

content = re.sub(r"const W_STD = 50;.*?\];", new_functions, content, flags=re.DOTALL)
content = re.sub(r"\{/\* Planta Arquitetônica \(Paredes\) - Esquerda \*/\}.*?\{/\* Divisória S15/16/17 e S18 \*/\}", new_walls.strip(), content, flags=re.DOTALL)

with open(r"c:\Users\MárcioGama\OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS\Área de Trabalho\Projetos\salomao-manager\src\components\collaborators\components\RHMapaAndar31.tsx", "w", encoding="utf-8") as f:
    f.write(content)
