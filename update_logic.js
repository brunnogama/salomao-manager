import fs from 'fs';

const p = '/home/brunogama/Projetos/salomao-manager/src/components/finance/components/ListaVencimentosOAB.tsx';
let txt = fs.readFileSync(p, 'utf8');

// replace the fetching block
txt = txt.replace(
`      // 1. Busca Colaboradores
      const { data: colaboradores, error: colError } = await supabase
        .from('collaborators')
        .select('*')

      if (colError) throw colError`,
`      // 1. Busca Colaboradores e tabelas de mapeamento
      const [colabRes, rolesRes, teamsRes] = await Promise.all([
        supabase.from('collaborators').select('*'),
        supabase.from('roles').select('id, name'),
        supabase.from('teams').select('id, name')
      ]);

      if (colabRes.error) throw colabRes.error;
      const colaboradores = colabRes.data;
      
      const rolesMap = new Map(rolesRes.data?.map(r => [String(r.id), r.name]) || []);
      const teamsMap = new Map(teamsRes.data?.map(t => [String(t.id), t.name]) || []);`);

// replace the filtering logic
txt = txt.replace(
`          const cargoLimpo = v.role?.trim().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") || '';
          const ehCargoValido = cargoLimpo.includes('advogad') || cargoLimpo.includes('socio') || cargoLimpo.includes('socia') || cargoLimpo.includes('estagiario') || cargoLimpo.includes('estagiaria') || cargoLimpo.includes('juridico') || cargoLimpo.includes('legal');
          
          if (v.role && !ehCargoValido && !v.equipe?.toLowerCase().includes('juridico')) return false;`,
`          const realRoleName = rolesMap.get(String(v.role)) || v.role || '';
          const realTeamName = teamsMap.get(String(v.equipe)) || v.equipe || '';

          const cargoLimpo = realRoleName.trim().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
          const equipeLimpa = realTeamName.trim().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");

          const ehCargoValido = cargoLimpo.includes('advogad') || cargoLimpo.includes('socio') || cargoLimpo.includes('socia') || cargoLimpo.includes('estagiario') || cargoLimpo.includes('estagiaria') || cargoLimpo.includes('juridico') || cargoLimpo.includes('legal');
          
          if (!ehCargoValido && !equipeLimpa.includes('juridico')) return false;
          
          // Inject real names back into object for display
          v.role = realRoleName;
          v.equipe = realTeamName;`);

fs.writeFileSync(p, txt);
