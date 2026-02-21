import fs from 'fs';

async function run() {
  const url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/collaborators?select=id,name,role,status,hire_date,equipe,oab_number,oab_uf";
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw";
  const response = await fetch(url, { headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` }});
  const data = await response.json();
  
  const rolesResponse = await fetch("https://iewevhdtwlviudetxgax.supabase.co/rest/v1/roles?select=id,name", { headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` } });
  const rolesData = await rolesResponse.json();
  const rolesMap = new Map(rolesData.map(r => [String(r.id), r.name]));

  const teamsResponse = await fetch("https://iewevhdtwlviudetxgax.supabase.co/rest/v1/teams?select=id,name", { headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` } });
  const teamsData = await teamsResponse.json();
  const teamsMap = new Map(teamsData.map(t => [String(t.id), t.name]));

  let totalAfterHireDate = 0;
  let totalAfterStatus = 0;
  let totalAfterCargo = 0;
  
  for(let i=0; i<data.length; i++) {
     let v = data[i];
     
     // 1. Hire date check
     if (!v.hire_date) {
        continue;
     }
     totalAfterHireDate++;

     // 2. Status check
     const statusLimpo = v.status?.trim().toLowerCase() || '';
     if (!statusLimpo.includes('ativ')) {
         continue;
     }
     totalAfterStatus++;

     // 3. Cargo / Equipe check
     const realRoleName = rolesMap.get(String(v.role)) || v.role || '';
     const realTeamName = teamsMap.get(String(v.equipe)) || v.equipe || '';

     const cargoLimpo = realRoleName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
     const equipeLimpa = realTeamName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

     const ehCargoValido = cargoLimpo.includes('advogad') || cargoLimpo.includes('socio') || cargoLimpo.includes('socia') || cargoLimpo.includes('estagiario') || cargoLimpo.includes('estagiaria') || cargoLimpo.includes('juridico') || cargoLimpo.includes('legal');
          
     if (!ehCargoValido && !equipeLimpa.includes('juridico')) {
         continue;
     }
     totalAfterCargo++;
     
     if (totalAfterCargo <= 2) {
         console.log("Candidate:", v.name, "| Role:", realRoleName, "| Team:", realTeamName, "| date:", v.hire_date);
     }
  }

  console.log("Total Initial:", data.length);
  console.log("Passed Hire Date:", totalAfterHireDate);
  console.log("Passed Status ('ativ'):", totalAfterStatus);
  console.log("Passed Cargo/Equipe:", totalAfterCargo);
}
run();
