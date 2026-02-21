import fs from 'fs';

async function run() {
  const url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/";
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw";
  
  const response = await fetch(url, {
    headers: {
      "apikey": apikey,
      "Authorization": `Bearer ${apikey}`
    }
  });

  const data = await response.json();
  console.log(Object.keys(data.paths).filter(p => p.startsWith("/")).map(p => p.slice(1)));

}
run();
