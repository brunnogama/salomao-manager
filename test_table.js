import fs from 'fs';

async function run() {
  const url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/collaborators?select=id,nome,cargo,status,data_admissao,equipe";
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw";
  
  const response = await fetch(url, {
    headers: {
      "apikey": apikey,
      "Authorization": `Bearer ${apikey}`
    }
  });

  if (!response.ok) {
     console.error("HTTP Erro:", response.status, await response.text());
     return;
  }
  
  const data = await response.json();
  console.log("Fetched " + data.length + " rows from collaborators");
  
  let totalProcessados = 0;
  for(let i=0; i<data.length; i++) {
     let v = data[i];
     if (!v.data_admissao) continue;
     const statusLimpo = v.status?.trim().toLowerCase() || '';
     if (!statusLimpo.includes('ativ')) continue;

     const cargoLimpo = v.cargo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
     const ehCargoValido = cargoLimpo.includes('advogad') || cargoLimpo.includes('socio') || cargoLimpo.includes('socia') || cargoLimpo.includes('estagiario') || cargoLimpo.includes('estagiaria') || cargoLimpo.includes('juridico') || cargoLimpo.includes('legal');
          
     if (v.cargo && !ehCargoValido && !v.equipe?.toLowerCase().includes('juridico')) continue;
     totalProcessados++;
     // console.log("=> " + v.nome + " / " + v.cargo + " / " + v.equipe + " / ADM: " + v.data_admissao);
  }
  
  console.log("Total Processados Válidos para OAB:", totalProcessados);
  let examples = data.filter(v => v.cargo && v.cargo.toLowerCase().includes('adv')).slice(0, 3);
  console.log("Exemplos de Advogados:", examples.map(d => d.nome + " (" + d.data_admissao + ")"));
}
run();
