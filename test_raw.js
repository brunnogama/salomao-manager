import fs from 'fs';

async function run() {
  const url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/collaborators?select=id,name,role,status,hire_date,equipe,oab_number,oab_uf";
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw";
  
  const response = await fetch(url, {
    headers: {
      "apikey": apikey,
      "Authorization": `Bearer ${apikey}`
    }
  });
  
  const data = await response.json();
  const sample = data.filter(d => d.status && d.status.toLowerCase().includes('ativ')).slice(0, 3);
  console.log("RAW SUPABASE DATA:", JSON.stringify(sample, null, 2));

  const rolesResponse = await fetch("https://iewevhdtwlviudetxgax.supabase.co/rest/v1/roles?select=id,name", {
      headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` }
  });
  const rolesData = await rolesResponse.json();
  console.log("ROLES MAP:", JSON.stringify(rolesData, null, 2));

  // let's manually apply our filter logic against raw data and see what we get
}
run();
