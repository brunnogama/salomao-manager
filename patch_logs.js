import fs from 'fs';

const p = '/home/brunogama/Projetos/salomao-manager/src/components/finance/components/ListaVencimentosOAB.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(
`      if (colabRes.error) throw colabRes.error;
      const colaboradores = colabRes.data;`,
`      if (colabRes.error) throw colabRes.error;
      const colaboradores = colabRes.data;
      console.log("[OAB_DEBUG] Total colabs from DB:", colaboradores.length);
      console.log("[OAB_DEBUG] Roles mapping count:", rolesMap.size);
      console.log("[OAB_DEBUG] Teams mapping count:", teamsMap.size);`);

txt = txt.replace(
`        const processados = colaboradores.filter((v: any) => {`,
`        const processados = colaboradores.filter((v: any) => {
          // let's just log a couple to see their raw format
          if (v.name === 'Bruno Gama' || v.name === 'Marcus Livio Gomes') {
               console.log("[OAB_DEBUG] Found sample user:", v.name, "Role:", v.role, "HireDate:", v.hire_date, "Status:", v.status);
          }`);

txt = txt.replace(
`        setVencimentos(processados)`,
`        console.log("[OAB_DEBUG] Final processados array size:", processados.length);
        setVencimentos(processados)`);

fs.writeFileSync(p, txt);
