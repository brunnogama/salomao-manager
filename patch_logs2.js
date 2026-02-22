import fs from 'fs';

const p = '/home/brunogama/Projetos/salomao-manager/src/components/finance/components/ListaVencimentosOAB.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(
`        const processados = colaboradores.map((v: any) => {`,
`        const processados = colaboradores.map((v: any) => {
          if (v.name === 'Bruno Gama' || v.name === 'Marcus Livio Gomes') {
               console.log("[OAB_DEBUG] MAP STEP User:", v.name, "RoleID:", v.role, "EquipeID:", v.equipe);
               console.log("[OAB_DEBUG] RolesMap Check:", rolesMap.get(String(v.role)));
               console.log("[OAB_DEBUG] TeamsMap Check:", teamsMap.get(String(v.equipe)));
          }`);

txt = txt.replace(
`        }).filter((v: any) => {`,
`        }).filter((v: any) => {
          if (v.name === 'Bruno Gama' || v.name === 'Marcus Livio Gomes') {
              console.log("[OAB_DEBUG] FILTER STEP. Role mapped:", v.role, "Equipe Mapped:", v.equipe, "Hire Date:", v.hire_date, "Status:", v.status);
          }`);

fs.writeFileSync(p, txt);
