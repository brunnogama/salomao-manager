import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/candidato_historico?select=*&limit=1`;

async function testSupabase() {
    console.log("Fetching: ", url);
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': process.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
            }
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch falhou:", e);
    }
}

testSupabase();
