// a simple node script that uses fetch
// requires no dependencies
const url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/partners?select=*&limit=1";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY1NTc5NDIsImV4cCI6MjExNzY3ODI4OX0.3w..."; // Let's just fetch from the live API since we saw the key earlier

require('dotenv').config({ path: '.env' })

fetch(url, {
    headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
})
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);
