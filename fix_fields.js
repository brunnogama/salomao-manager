import fs from 'fs';

const p = '/home/brunogama/Projetos/salomao-manager/src/components/finance/components/ListaVencimentosOAB.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace('vencimento.role • vencimento.equipe', 'vencimento.role • vencimento.equipe'); // Already fine

fs.writeFileSync(p, txt);
